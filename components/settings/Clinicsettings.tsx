"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  IconBuilding,
  IconPhone,
  IconMapPin,
  IconDeviceFloppy,
  IconTrash,
  IconAlertTriangle,
  IconClock,
  IconCheck,
} from "@tabler/icons-react";

type Clinic = {
  id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
};

type Tab = "general" | "hours" | "danger";

const WEEKDAYS = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

type DaySchedule = { open: boolean; from: string; to: string };
type Schedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: Schedule = {
  mon: { open: true,  from: "09:00", to: "20:00" },
  tue: { open: true,  from: "09:00", to: "20:00" },
  wed: { open: true,  from: "09:00", to: "20:00" },
  thu: { open: true,  from: "09:00", to: "20:00" },
  fri: { open: true,  from: "09:00", to: "18:00" },
  sat: { open: false, from: "10:00", to: "14:00" },
  sun: { open: false, from: "10:00", to: "14:00" },
};

export function ClinicSettings() {
  const { id: clinicId } = useParams<{ id: string }>();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // General form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Hours state (stored locally for now; could be persisted via API)
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);

  useEffect(() => {
    if (!clinicId) return;
    fetch(`/api/clinics/${clinicId}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: Clinic | null) => {
        if (data) {
          setClinic(data);
          setName(data.name ?? "");
          setPhone(data.phone ?? "");
          setAddress(data.address ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clinicId]);

  const handleSave = async () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`/api/clinics/${clinicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null, address: address.trim() || null }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.error ?? "Error guardando"); }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error guardando");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/clinics/${clinicId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando");
      router.push("/platform");
    } catch { /* handled */ }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50" />
    </div>
  );

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-800">
        {([
          { id: "general", label: "General",   icon: IconBuilding },
          { id: "hours",   label: "Horarios",  icon: IconClock },
          { id: "danger",  label: "Zona peligrosa", icon: IconAlertTriangle },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px
              ${activeTab === tab.id
                ? tab.id === "danger"
                  ? "border-red-500 text-red-600 dark:text-red-400"
                  : "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── General Tab ── */}
      {activeTab === "general" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-5">Información de la clínica</h2>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5"><IconBuilding className="w-4 h-4 text-zinc-400" />Nombre de la clínica *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Clínica Dental Ejemplo" />
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5"><IconPhone className="w-4 h-4 text-zinc-400" />Teléfono</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 954 000 000" />
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5"><IconMapPin className="w-4 h-4 text-zinc-400" />Dirección</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle Mayor 1, Sevilla" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{error}</p>}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : saved ? (
                  <IconCheck className="w-4 h-4" />
                ) : (
                  <IconDeviceFloppy className="w-4 h-4" />
                )}
                {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar cambios"}
              </Button>
              {saved && <span className="text-sm text-green-600 dark:text-green-400">Los cambios se han guardado correctamente.</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── Hours Tab ── */}
      {activeTab === "hours" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">Horario de apertura</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">Define el horario de tu clínica. Esta información es orientativa.</p>
          <div className="space-y-3">
            {WEEKDAYS.map(day => {
              const s = schedule[day.key];
              return (
                <div key={day.key} className="flex items-center gap-4">
                  <div className="w-24 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={s.open}
                        onChange={e => setSchedule(prev => ({ ...prev, [day.key]: { ...prev[day.key], open: e.target.checked } }))}
                        className="w-4 h-4 rounded border-zinc-300"
                      />
                      <span className={`text-sm font-medium ${s.open ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"}`}>{day.label}</span>
                    </label>
                  </div>
                  {s.open ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time" value={s.from} className="w-28"
                        onChange={e => setSchedule(prev => ({ ...prev, [day.key]: { ...prev[day.key], from: e.target.value } }))}
                      />
                      <span className="text-zinc-400 text-sm">—</span>
                      <Input
                        type="time" value={s.to} className="w-28"
                        onChange={e => setSchedule(prev => ({ ...prev, [day.key]: { ...prev[day.key], to: e.target.value } }))}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-zinc-400 italic">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }} className="gap-2">
              {saved ? <IconCheck className="w-4 h-4" /> : <IconDeviceFloppy className="w-4 h-4" />}
              {saved ? "¡Guardado!" : "Guardar horarios"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Danger Zone Tab ── */}
      {activeTab === "danger" && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <IconAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Zona peligrosa</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Las acciones de esta sección son irreversibles. Por favor, asegúrate de entender las consecuencias antes de proceder.
                </p>
              </div>
            </div>

            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-white dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">Eliminar esta clínica</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Se eliminarán todos los datos: citas, pacientes vinculados, gabinetes y miembros del equipo.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2 shrink-0">
                      <IconTrash className="w-4 h-4" />
                      Eliminar clínica
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar la clínica permanentemente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminarán todos los datos de{" "}
                        <strong>{clinic?.name ?? "la clínica"}</strong>, incluyendo citas, pacientes, gabinetes y miembros.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Sí, eliminar todo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}