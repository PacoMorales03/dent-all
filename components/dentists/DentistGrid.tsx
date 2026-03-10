"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  IconUserPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconStethoscope,
  IconPhone,
  IconStar,
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

type Dentist = {
  id: string;
  name: string | null;
  surname: string | null;
  phone: string | null;
  specialty: string | null;
};

const SPECIALTIES = [
  "Odontología General",
  "Ortodoncia",
  "Endodoncia",
  "Periodoncia",
  "Implantología",
  "Cirugía Oral",
  "Odontopediatría",
  "Estética Dental",
  "Prostodoncia",
  "Radiología Oral",
];

// ─── Create Dentist Dialog ───────────────────────────────────────────────────
function CreateDentistDialog({ onCreated }: { onCreated: (d: Dentist) => void }) {
  const { id: clinicId } = useParams<{ id: string }>();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/dentists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), surname: surname.trim() || undefined, phone: phone.trim() || undefined, specialty: specialty.trim() || undefined, clinicId }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.error ?? "Error creando dentista"); }
      const dentist: Dentist = await res.json();
      onCreated(dentist);
      setName(""); setSurname(""); setPhone(""); setSpecialty(""); setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error creando dentista");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!loading) { setOpen(v); if (!v) { setName(""); setSurname(""); setPhone(""); setSpecialty(""); setError(""); } } }}>
      <DialogTrigger asChild>
        <Button className="gap-2"><IconUserPlus className="w-4 h-4" />Nuevo dentista</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo dentista</DialogTitle>
          <DialogDescription>Añade un dentista al equipo de la clínica.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Nombre *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="María" disabled={loading} autoFocus />
            </div>
            <div className="grid gap-1">
              <Label>Apellidos</Label>
              <Input value={surname} onChange={e => setSurname(e.target.value)} placeholder="López" disabled={loading} />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 600 000 000" disabled={loading} />
          </div>
          <div className="grid gap-1">
            <Label>Especialidad</Label>
            <select
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Sin especialidad</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded p-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={loading}>{loading ? "Creando..." : "Crear dentista"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dentist Dialog ─────────────────────────────────────────────────────
function EditDentistDialog({ dentist, onUpdated }: { dentist: Dentist; onUpdated: (d: Dentist) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(dentist.name ?? "");
  const [surname, setSurname] = useState(dentist.surname ?? "");
  const [phone, setPhone] = useState(dentist.phone ?? "");
  const [specialty, setSpecialty] = useState(dentist.specialty ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setName(dentist.name ?? ""); setSurname(dentist.surname ?? ""); setPhone(dentist.phone ?? ""); setSpecialty(dentist.specialty ?? ""); setError(""); }
  }, [open, dentist]);

  const handleUpdate = async () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/dentists/${dentist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), surname: surname.trim() || null, phone: phone.trim() || null, specialty: specialty.trim() || null }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.error ?? "Error actualizando"); }
      const updated: Dentist = await res.json();
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
          <DialogTitle>Editar dentista</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1"><Label>Nombre *</Label><Input value={name} onChange={e => setName(e.target.value)} disabled={loading} /></div>
            <div className="grid gap-1"><Label>Apellidos</Label><Input value={surname} onChange={e => setSurname(e.target.value)} disabled={loading} /></div>
          </div>
          <div className="grid gap-1"><Label>Teléfono</Label><Input value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} /></div>
          <div className="grid gap-1">
            <Label>Especialidad</Label>
            <select value={specialty} onChange={e => setSpecialty(e.target.value)} disabled={loading} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Sin especialidad</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
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

// ─── Specialty badge colors ──────────────────────────────────────────────────
const specialtyColors: Record<string, string> = {
  "Ortodoncia": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Endodoncia": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Implantología": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Periodoncia": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Cirugía Oral": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Odontopediatría": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "Estética Dental": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function SpecialtyBadge({ specialty }: { specialty: string | null }) {
  if (!specialty) return <span className="text-zinc-300 dark:text-zinc-600 text-xs">Sin especialidad</span>;
  const color = specialtyColors[specialty] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>{specialty}</span>;
}

// ─── Main DentistsGrid ───────────────────────────────────────────────────────
export function DentistsGrid() {
  const { id: clinicId } = useParams<{ id: string }>();
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchDentists = useCallback(async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/clinicDentist?clinicId=${clinicId}`);
      if (!res.ok) throw new Error("Error cargando dentistas");
      const data: Dentist[] = await res.json();
      setDentists(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando dentistas");
    } finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { fetchDentists(); }, [fetchDentists]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dentists/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando");
      setDentists(prev => prev.filter(d => d.id !== id));
    } catch { /* handled */ }
  };

  const filtered = dentists.filter(d => {
    const q = search.toLowerCase();
    return (d.name ?? "").toLowerCase().includes(q) || (d.surname ?? "").toLowerCase().includes(q) || (d.specialty ?? "").toLowerCase().includes(q);
  });

  const specialtyCounts = dentists.reduce<Record<string, number>>((acc, d) => {
    const s = d.specialty ?? "General";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p className="text-red-700 dark:text-red-400">{error}</p>
      <button onClick={fetchDentists} className="mt-2 text-sm text-red-600 underline">Reintentar</button>
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input placeholder="Buscar por nombre o especialidad..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <CreateDentistDialog onCreated={d => setDentists(prev => [...prev, d])} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{dentists.length}</p>
          <p className="text-sm text-zinc-500">Total dentistas</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{Object.keys(specialtyCounts).length}</p>
          <p className="text-sm text-zinc-500">Especialidades</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hidden sm:block">
          <p className="text-2xl font-bold text-blue-600">{dentists.filter(d => d.phone).length}</p>
          <p className="text-sm text-zinc-500">Con contacto</p>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <IconStethoscope className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            {search ? "Sin resultados" : "No hay dentistas"}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            {search ? "Prueba con otro término" : "Añade el primer dentista al equipo"}
          </p>
          {!search && <CreateDentistDialog onCreated={d => setDentists(prev => [...prev, d])} />}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(dentist => (
            <div key={dentist.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full w-11 h-11 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-white font-semibold text-base">
                      {(dentist.name ?? "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      Dr. {dentist.name} {dentist.surname}
                    </p>
                    <SpecialtyBadge specialty={dentist.specialty} />
                  </div>
                </div>
              </div>

              {dentist.phone && (
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  <IconPhone className="w-3.5 h-3.5" />
                  <span>{dentist.phone}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-1 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <EditDentistDialog dentist={dentist} onUpdated={d => setDentists(prev => prev.map(x => x.id === d.id ? d : x))} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <IconTrash className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar dentista?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará permanentemente a <strong>Dr. {dentist.name} {dentist.surname}</strong> del equipo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(dentist.id)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}