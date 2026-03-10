"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format, startOfWeek, addWeeks, isSameDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useParams } from "next/navigation"; // ✅ FIX: obtener clinicId de la URL

import CreateAppointmentButton from "./CreateAppointmentButton";
import AppointmentItem from "./AppointmentItem";
import SelectDentistsOnAppointments from "./SelectDentistsOnAppointments";
import SelectCabinetsOnAppointments from "./SelectCabinetsOnAppointments";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);
const PX_PER_MINUTE = 1.2;
const TOTAL_MINUTES = HOURS.length * 60;

type AppointmentStatus = "scheduled" | "completed" | "no_show" | "cancelled";

export type Appointment = {
  id: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  dentistId: string;
  cabinetId: string;
  patientId: string;
};

type SelectedSlot = {
  day: Date;
  hour: number;
};

type PositionedAppointment = Appointment & {
  column: number;
  columns: number;
};

function getMinutesFromDate(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function layoutAppointments(appointments: Appointment[]): PositionedAppointment[] {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  const active: { appt: Appointment; column: number }[] = [];
  const positioned: PositionedAppointment[] = [];

  sorted.forEach((appt) => {
    const start = new Date(appt.startAt).getTime();

    for (let i = active.length - 1; i >= 0; i--) {
      if (new Date(active[i].appt.endAt).getTime() <= start) {
        active.splice(i, 1);
      }
    }

    const used = active.map((a) => a.column);
    let column = 0;
    while (used.includes(column)) column++;

    active.push({ appt, column });

    const columns = Math.max(...active.map((a) => a.column)) + 1;
    positioned.push({ ...appt, column, columns });
  });

  return positioned;
}

export default function WeeklyAgenda() {
  // ✅ FIX: obtener el clinicId del segmento dinámico de la URL /platform/clinic/[id]/...
  const { id: clinicId } = useParams<{ id: string }>();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [filterDentist, setFilterDentist] = useState("");
  const [filterCabinet, setFilterCabinet] = useState("");

  const clearFilters = () => {
    setFilterDentist("");
    setFilterCabinet("");
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const today = new Date();
  const currentMinutes = today.getHours() * 60 + today.getMinutes();
  const currentTimeRef = useRef<HTMLDivElement>(null);

  // useCallback estable para pasarlo como prop a hijos (onCreated, onUpdated...)
  const fetchAppointments = useCallback(async () => {
    if (!clinicId) return;
    const res = await fetch(`/api/appointments?clinicID=${clinicId}`);
    if (!res.ok) {
      console.error("Error cargando citas:", res.status, await res.text());
      return;
    }
    setAppointments(await res.json());
  }, [clinicId]);

  // La función async va DENTRO del efecto para evitar el warning
  // react-hooks/set-state-in-effect. El flag "cancelled" previene
  // actualizaciones de estado si el componente se desmonta antes
  // de que el fetch termine (evita memory leaks).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clinicId) return;
      const res = await fetch(`/api/appointments?clinicID=${clinicId}`);
      if (!res.ok || cancelled) return;
      setAppointments(await res.json());
    }
    load();
    return () => { cancelled = true; };
  }, [clinicId, currentWeek]);

  return (
    <div className="w-screen max-h-140 flex flex-col border rounded-lg relative">
      {/* ================= HEADER ================= */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-2 gap-4 flex-wrap">
          {/* Navegación semanas */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek((w) => addWeeks(w, -1))}
            >
              ←
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {format(weekStart, "dd MMM", { locale: es })} -{" "}
                  {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentWeek}
                  onSelect={(date) => date && setCurrentWeek(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek((w) => addWeeks(w, 1))}
            >
              →
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentWeek(new Date())}
            >
              Hoy
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <SelectDentistsOnAppointments
              value={filterDentist}
              onChange={setFilterDentist}
            />
            <SelectCabinetsOnAppointments
              value={filterCabinet}
              onChange={setFilterCabinet}
            />
            {(filterDentist || filterCabinet) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Cabecera días */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-t">
          <div />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`text-center text-sm py-2 font-medium border-l ${
                isSameDay(day, today)
                  ? "bg-primary text-primary-foreground"
                  : ""
              }`}
            >
              <div className="capitalize">
                {format(day, "EEEE", { locale: es })}
              </div>
              <div className="text-xs opacity-80">{format(day, "dd/MM")}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="grid grid-cols-[80px_repeat(7,1fr)]"
          style={{ height: TOTAL_MINUTES * PX_PER_MINUTE }}
        >
          {/* Horas */}
          <div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border text-xs px-2"
                style={{ height: 60 * PX_PER_MINUTE }}
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayAppointments = appointments.filter(
              (a) =>
                isSameDay(new Date(a.startAt), day) &&
                (!filterDentist || a.dentistId === filterDentist) &&
                (!filterCabinet || a.cabinetId === filterCabinet) &&
                a.status !== "cancelled",
            );

            const positioned = layoutAppointments(dayAppointments);

            return (
              <div key={day.toISOString()} className="relative border-l">
                {HOURS.map((hour) => {
                  const isSelected =
                    selectedSlot &&
                    isSameDay(selectedSlot.day, day) &&
                    selectedSlot.hour === hour;

                  return (
                    <div
                      key={hour}
                      onClick={() => setSelectedSlot({ day, hour })}
                      className={`border cursor-pointer ${
                        isSelected ? "bg-muted" : "hover:bg-accent"
                      }`}
                      style={{ height: 60 * PX_PER_MINUTE }}
                    />
                  );
                })}

                {isSameDay(day, today) && (
                  <div
                    ref={currentTimeRef}
                    className="absolute left-0 right-0 h-0.5 bg-red-500"
                    style={{ top: currentMinutes * PX_PER_MINUTE }}
                  />
                )}

                {positioned.map((appt) => {
                  const start = new Date(appt.startAt);
                  const end = new Date(appt.endAt);

                  const top =
                    (getMinutesFromDate(start) - 7 * 60) * PX_PER_MINUTE;
                  const height =
                    (getMinutesFromDate(end) - getMinutesFromDate(start)) *
                    PX_PER_MINUTE;

                  const width = 100 / appt.columns;

                  return (
                    <AppointmentItem
                      key={appt.id}
                      appointment={appt}
                      style={{
                        position: "absolute",
                        top,
                        height,
                        width: `${width}%`,
                        left: `${appt.column * width}%`,
                      }}
                      onUpdated={fetchAppointments}
                      onDeleted={fetchAppointments}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <CreateAppointmentButton
        selectedSlot={selectedSlot}
        onCreated={() => {
          fetchAppointments();
          setSelectedSlot(null);
        }}
      />
    </div>
  );
}