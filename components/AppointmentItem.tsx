"use client";

import { format } from "date-fns";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import SelectDentistsOnAppointments from "./SelectDentistsOnAppointments";
import SelectCabinetsOnAppointments from "./SelectCabinetsOnAppointments";
import SelectPatientsOnAppointments from "./SelectPatiensOnAppointments";

type Props = {
  appointment: {
    id: string;
    description: string | null;
    startAt: string;
    endAt: string;
    status: "scheduled" | "completed" | "no_show" | "cancelled";
    dentistId: string;
    cabinetId: string;
    patientId: string;
  };
  style: React.CSSProperties;
  onUpdated?: () => void;
  onDeleted?: () => void;
};

function getAppointmentStyles(status: Props["appointment"]["status"]) {
  switch (status) {
    case "completed":
      return "bg-green-500 text-white";
    case "no_show":
      return "bg-red-500 text-white";
    case "scheduled":
      return "bg-blue-500 text-white";
    default:
      return "";
  }
}

export default function AppointmentItem({ appointment, style, onUpdated, onDeleted }: Props) {
  const [open, setOpen] = useState(false);

  // Form state
  const [patient, setPatient] = useState("");
  const [dentist, setDentist] = useState("");
  const [cabinetId, setCabinetId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos cuando se abre el sheet
  useEffect(() => {
    if (!open) return;

    const start = new Date(appointment.startAt);
    const end = new Date(appointment.endAt);

    const diffMinutes = (end.getTime() - start.getTime()) / 1000 / 60;

    setPatient(appointment.patientId);
    setDentist(appointment.dentistId);
    setCabinetId(appointment.cabinetId);
    setDescription(appointment.description ?? "");
    setDate(format(start, "yyyy-MM-dd"));
    setTime(format(start, "HH:mm"));
    setDuration(String(diffMinutes));
  }, [open, appointment]);

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);

    try {
      const [hours, minutes] = time.split(":").map(Number);

      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + Number(duration));

      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient,
          dentistId: dentist,
          cabinetId,
          description,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Error actualizando la cita");
        setLoading(false);
        return;
      }

      setOpen(false);
      if (onUpdated) onUpdated();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta cita?")) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setError("Error eliminando cita");
        setLoading(false);
        return;
      }

      setOpen(false);
      if (onDeleted) onDeleted();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  const start = new Date(appointment.startAt);
  const end = new Date(appointment.endAt);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className={`absolute rounded text-xs p-1 shadow cursor-pointer hover:opacity-90 ${getAppointmentStyles(
          appointment.status,
        )}`}
        style={style}
      >
        <div className="font-medium truncate">
          {appointment.description ?? "Cita"}
        </div>
        <div className="opacity-80">
          {format(start, "HH:mm")} - {format(end, "HH:mm")}
        </div>
      </div>

      {/* ===== SHEET EDICIÓN ===== */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-auto">
          <SheetHeader>
            <SheetTitle>Editar cita</SheetTitle>
          </SheetHeader>

          <div className="grid gap-4 mt-4 p-4">
            <SelectPatientsOnAppointments
              value={patient}
              onChange={setPatient}
              disabled={loading}
            />

            <SelectDentistsOnAppointments
              value={dentist}
              onChange={setDentist}
              disabled={loading}
            />

            <SelectCabinetsOnAppointments
              value={cabinetId}
              onChange={setCabinetId}
              disabled={loading}
            />

            <div className="grid gap-1">
              <Label>Descripción</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-1">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-1">
              <Label>Hora</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-1">
              <Label>Duración (min)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <SheetFooter className="mt-6 flex gap-2">
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Eliminar
            </Button>

            <SheetClose asChild>
              <Button variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
