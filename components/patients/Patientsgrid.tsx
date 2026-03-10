"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  IconUserPlus,
  IconUser,
  IconPhone,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconChevronRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Patient = {
  id: string;
  name: string | null;
  surname: string | null;
  phone: string | null;
};

type Appointment = {
  id: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
};

// ─── Create Patient Dialog ───────────────────────────────────────────────────
function CreatePatientDialog({ onCreated }: { onCreated: (p: Patient) => void }) {
  const { id: clinicId } = useParams<{ id: string }>();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), surname: surname.trim() || undefined, phone: phone.trim() || undefined, clinicId }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.error ?? "Error creando paciente"); }
      const patient: Patient = await res.json();
      onCreated(patient);
      setName(""); setSurname(""); setPhone(""); setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error creando paciente");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { setOpen(v); if (!v) { setName(""); setSurname(""); setPhone(""); setError(""); } } }}>
      <DialogTrigger asChild>
        <Button className="gap-2"><IconUserPlus className="w-4 h-4" />Nuevo paciente</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo paciente</DialogTitle>
          <DialogDescription>Añade un nuevo paciente a la clínica.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-1">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Juan" disabled={loading} autoFocus />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="surname">Apellidos</Label>
            <Input id="surname" value={surname} onChange={e => setSurname(e.target.value)} placeholder="García López" disabled={loading} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 600 000 000" disabled={loading} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded p-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={loading}>{loading ? "Creando..." : "Crear paciente"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Patient Dialog ─────────────────────────────────────────────────────
function EditPatientDialog({ patient, onUpdated }: { patient: Patient; onUpdated: (p: Patient) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(patient.name ?? "");
  const [surname, setSurname] = useState(patient.surname ?? "");
  const [phone, setPhone] = useState(patient.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setName(patient.name ?? ""); setSurname(patient.surname ?? ""); setPhone(patient.phone ?? ""); setError(""); }
  }, [open, patient]);

  const handleUpdate = async () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), surname: surname.trim() || null, phone: phone.trim() || null }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.error ?? "Error actualizando"); }
      const updated: Patient = await res.json();
      onUpdated(updated); setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error actualizando");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!loading) setOpen(v); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><IconEdit className="w-4 h-4" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar paciente</DialogTitle>
          <DialogDescription>Modifica los datos del paciente.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-1">
            <Label>Nombre *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} disabled={loading} />
          </div>
          <div className="grid gap-1">
            <Label>Apellidos</Label>
            <Input value={surname} onChange={e => setSurname(e.target.value)} disabled={loading} />
          </div>
          <div className="grid gap-1">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Patient Detail Sheet ────────────────────────────────────────────────────
function PatientDetailSheet({ patient, open, onClose }: { patient: Patient | null; open: boolean; onClose: () => void }) {
  const { id: clinicId } = useParams<{ id: string }>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !patient) return;
    let cancelled = false;

    async function fetchAppointments() {
      setLoading(true);
      try {
        const r = await fetch(`/api/appointments?clinicID=${clinicId}`);
        const data: Appointment[] = await r.json();
        if (!cancelled) setAppointments(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAppointments();
    return () => { cancelled = true; };
  }, [open, patient, clinicId]);

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    no_show: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };
  const statusLabels: Record<string, string> = {
    scheduled: "Programada", completed: "Completada", cancelled: "Cancelada", no_show: "No acudió",
  };

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
              <IconUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            {patient?.name} {patient?.surname}
          </SheetTitle>
        </SheetHeader>
        {patient && (
          <div className="space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Datos de contacto</h3>
              <div className="flex items-center gap-2 text-sm">
                <IconPhone className="w-4 h-4 text-zinc-400" />
                <span>{patient.phone ?? "Sin teléfono"}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <IconCalendar className="w-4 h-4" /> Historial de citas
              </h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 dark:border-zinc-50" />
                </div>
              ) : appointments.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No hay citas registradas</p>
              ) : (
                <div className="space-y-2">
                  {appointments.slice(0, 10).map(appt => (
                    <div key={appt.id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{new Date(appt.startAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[appt.status]}`}>{statusLabels[appt.status]}</span>
                      </div>
                      {appt.description && <p className="text-xs text-zinc-500 mt-1">{appt.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main PatientsGrid ───────────────────────────────────────────────────────
export function PatientsGrid() {
  const { id: clinicId } = useParams<{ id: string }>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchPatients = useCallback(async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/clinic-patients?clinicId=${clinicId}`);
      if (!res.ok) throw new Error("Error cargando pacientes");
      const data: Patient[] = await res.json();
      setPatients(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando pacientes");
    } finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando paciente");
      setPatients(prev => prev.filter(p => p.id !== id));
    } catch { /* handled silently */ }
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return (p.name ?? "").toLowerCase().includes(q) || (p.surname ?? "").toLowerCase().includes(q) || (p.phone ?? "").includes(q);
  });

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p className="text-red-700 dark:text-red-400">{error}</p>
      <button onClick={fetchPatients} className="mt-2 text-sm text-red-600 underline">Reintentar</button>
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-50">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder="Buscar por nombre, apellido o teléfono..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <CreatePatientDialog onCreated={p => setPatients(prev => [...prev, p])} />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{patients.length}</p>
          <p className="text-sm text-zinc-500">Total pacientes</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{filtered.length}</p>
          <p className="text-sm text-zinc-500">Resultados</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hidden sm:block">
          <p className="text-2xl font-bold text-blue-600">{patients.filter(p => p.phone).length}</p>
          <p className="text-sm text-zinc-500">Con teléfono</p>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <IconUser className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            {search ? "Sin resultados" : "No hay pacientes"}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            {search ? "Prueba con otro término de búsqueda" : "Crea tu primer paciente para comenzar"}
          </p>
          {!search && <CreatePatientDialog onCreated={p => setPatients(prev => [...prev, p])} />}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Paciente</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">Teléfono</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient, i) => (
                <tr
                  key={patient.id}
                  className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-9 h-9 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {(patient.name ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{patient.name} {patient.surname}</p>
                        <p className="text-xs text-zinc-400 sm:hidden">{patient.phone ?? "Sin teléfono"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">
                    {patient.phone ? (
                      <span className="flex items-center gap-1"><IconPhone className="w-3.5 h-3.5" />{patient.phone}</span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => { setSelectedPatient(patient); setSheetOpen(true); }}
                        title="Ver detalle"
                      >
                        <IconChevronRight className="w-4 h-4" />
                      </Button>
                      <EditPatientDialog patient={patient} onUpdated={p => setPatients(prev => prev.map(x => x.id === p.id ? p : x))} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <IconTrash className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará permanentemente a <strong>{patient.name} {patient.surname}</strong> y todas sus citas asociadas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(patient.id)} className="bg-red-600 hover:bg-red-700">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PatientDetailSheet patient={selectedPatient} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}