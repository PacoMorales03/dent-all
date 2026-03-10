"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  IconCalendar, IconUsers, IconStethoscope, IconDoor,
  IconTrendingUp, IconCheck, IconX, IconClock,
} from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Appointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
  dentistId: string;
  cabinetId: string;
  patientId: string;
  description: string | null;
};

type Patient = { id: string; name: string | null; surname: string | null };
type Dentist  = { id: string; name: string | null; surname: string | null; specialty: string | null };
type Cabinet  = { id: string; num: number };

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{value}</p>
          {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Chart section wrapper ───────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">{title}</h3>
      {children}
    </div>
  );
}

const STATUS_COLORS = {
  scheduled: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#ef4444",
  no_show:   "#f59e0b",
};
const STATUS_LABELS = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show:   "No acudió",
};

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export function DashboardContent() {
  const { id: clinicId } = useParams<{ id: string }>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients,     setPatients]     = useState<Patient[]>([]);
  const [dentists,     setDentists]     = useState<Dentist[]>([]);
  const [cabinets,     setCabinets]     = useState<Cabinet[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    Promise.all([
      fetch(`/api/appointments?clinicID=${clinicId}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/clinic-patients?clinicId=${clinicId}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/clinicDentist?clinicId=${clinicId}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/cabinets?clinicId=${clinicId}`).then(r => r.ok ? r.json() : []),
    ]).then(([appts, pats, dents, cabs]) => {
      setAppointments(Array.isArray(appts) ? appts : []);
      setPatients(Array.isArray(pats) ? pats : []);
      setDentists(Array.isArray(dents) ? dents : []);
      setCabinets(Array.isArray(cabs) ? cabs : []);
    }).finally(() => setLoading(false));
  }, [clinicId]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  );

  // ── Derived metrics ──────────────────────────────────────────────────────
  const today = new Date();
  const todayStr = today.toDateString();

  const todayAppts    = appointments.filter(a => new Date(a.startAt).toDateString() === todayStr);
  const scheduledAppts = appointments.filter(a => a.status === "scheduled");
  const completedAppts = appointments.filter(a => a.status === "completed");
  const completionRate = appointments.length > 0
    ? Math.round((completedAppts.length / appointments.length) * 100)
    : 0;

  // ── Appointments by month (last 6 months) ────────────────────────────────
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = d.getMonth();
    const year  = d.getFullYear();
    const appts = appointments.filter(a => {
      const ad = new Date(a.startAt);
      return ad.getMonth() === month && ad.getFullYear() === year;
    });
    return {
      name: MONTH_NAMES[month],
      Programadas: appts.filter(a => a.status === "scheduled").length,
      Completadas: appts.filter(a => a.status === "completed").length,
      Canceladas:  appts.filter(a => a.status === "cancelled").length,
    };
  });

  // ── Appointments by status (pie) ─────────────────────────────────────────
  const statusData = (["scheduled","completed","cancelled","no_show"] as const)
    .map(s => ({ name: STATUS_LABELS[s], value: appointments.filter(a => a.status === s).length, color: STATUS_COLORS[s] }))
    .filter(d => d.value > 0);

  // ── Appointments per dentist ──────────────────────────────────────────────
  const dentistData = dentists.map(d => ({
    name: `Dr. ${d.name ?? ""}${d.surname ? " " + d.surname[0] + "." : ""}`,
    Citas: appointments.filter(a => a.dentistId === d.id).length,
  })).sort((a, b) => b.Citas - a.Citas).slice(0, 6);

  // ── Appointments per weekday ──────────────────────────────────────────────
  const weekdayLabels = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const weekdayData = weekdayLabels.map((name, i) => ({
    name,
    Citas: appointments.filter(a => new Date(a.startAt).getDay() === i).length,
  }));

  // ── Cabinet utilization ───────────────────────────────────────────────────
  const cabinetData = cabinets.map(c => ({
    name: `Gab. ${c.num}`,
    Citas: appointments.filter(a => a.cabinetId === c.id).length,
  })).sort((a, b) => b.Citas - a.Citas);

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Pacientes"    value={patients.length}    sub="registrados"                   icon={IconUsers}       color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <KpiCard label="Dentistas"    value={dentists.length}    sub="en el equipo"                  icon={IconStethoscope} color="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        <KpiCard label="Citas hoy"    value={todayAppts.length}  sub={`${scheduledAppts.length} pendientes`} icon={IconCalendar}    color="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <KpiCard label="Completadas"  value={`${completionRate}%`} sub="tasa de completado"           icon={IconTrendingUp}  color="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      {/* Status mini cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["scheduled","completed","cancelled","no_show"] as const).map(s => {
          const count = appointments.filter(a => a.status === s).length;
          const icons = { scheduled: IconClock, completed: IconCheck, cancelled: IconX, no_show: IconX };
          const Icon = icons[s];
          return (
            <div key={s} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3">
              <div style={{ backgroundColor: STATUS_COLORS[s] + "22", color: STATUS_COLORS[s] }} className="rounded-lg p-2">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{count}</p>
                <p className="text-xs text-zinc-500">{STATUS_LABELS[s]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="Citas por mes (últimos 6 meses)">
            {monthlyData.every(m => m.Completadas === 0 && m.Programadas === 0 && m.Canceladas === 0) ? (
              <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">Sin datos de citas</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} barSize={10} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Programadas" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="Completadas" fill="#22c55e" radius={[3,3,0,0]} />
                  <Bar dataKey="Canceladas"  fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <ChartCard title="Estado de citas">
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">Sin datos</div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span>{s.name}: {s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Citas por dentista">
          {dentistData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">Sin dentistas registrados</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dentistData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="Citas" fill="#8b5cf6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Distribución por día de la semana">
          {appointments.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">Sin datos de citas</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Citas" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Cabinet utilization */}
      {cabinetData.length > 0 && (
        <ChartCard title="Uso de gabinetes">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cabinetData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="Citas" fill="#06b6d4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Recent appointments */}
      {appointments.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Próximas citas</h3>
          <div className="space-y-2">
            {appointments
              .filter(a => a.status === "scheduled" && new Date(a.startAt) >= new Date())
              .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
              .slice(0, 5)
              .map(appt => {
                const pat = patients.find(p => p.id === appt.patientId);
                const dent = dentists.find(d => d.id === appt.dentistId);
                return (
                  <div key={appt.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {(pat?.name ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{pat?.name} {pat?.surname}</p>
                        <p className="text-xs text-zinc-400">Dr. {dent?.name} {dent?.surname}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {new Date(appt.startAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {new Date(appt.startAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}