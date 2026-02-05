"use client";

import { useState, useEffect, useRef } from "react";
import {
  format,
  startOfWeek,
  addWeeks,
  isSameDay,
  addDays as addDaysDate,
} from "date-fns";
import { es } from "date-fns/locale";
import CreateAppointmentButton from "./CreateAppointmentButton";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PX_PER_MINUTE = 1.2;

type AppointmentStatus = "scheduled" | "completed" | "no_show" | "cancelled";

type Appointment = {
  id: string;
  clinicID: string | null;
  description: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
};

type SelectedSlot = {
  day: Date;
  hour: number;
};

function getMinutesFromDate(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function getAppointmentStyles(status: AppointmentStatus) {
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

export default function WeeklyAgenda() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDaysDate(weekStart, i));

  const today = new Date();
  const currentMinutes = today.getHours() * 60 + today.getMinutes();
  const currentTimeRef = useRef<HTMLDivElement>(null);

  // Función para cargar citas
  async function fetchAppointments() {
    try {
      const res = await fetch("/api/appointments");
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments", error);
    }
  }

  useEffect(() => {
    (async () => {
      await fetchAppointments();
    })();
  }, []);

  useEffect(() => {
    if (currentTimeRef.current) {
      currentTimeRef.current.scrollIntoView({ block: "center" });
    }
  }, []);

  return (
    <div className="w-screen max-h-140 bg-background border rounded-lg flex flex-col relative pl-5 pr-5 pb">
      {/* Controles - sticky dentro del contenedor */}
      <div className="sticky top-0 bg-background border-b flex justify-between items-center mb-4 z-10 px-4 py-2">
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
          className="border px-3 py-1 rounded hover:bg-accent"
        >
          ← Semana anterior
        </button>

        <div className="font-medium">
          Semana del {format(weekStart, "dd MMM yyyy", { locale: es })}
        </div>

        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          className="border px-3 py-1 rounded hover:bg-accent"
        >
          Semana siguiente →
        </button>
      </div>

      {/* Agenda */}
      <div className="flex flex-col grow border rounded-lg overflow-hidden relative">
        {/* Header de tabla */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-muted text-sm font-medium shrink-0 sticky top-44px z-10 border-b">
          {/* sticky top=[altura controles] para que quede justo debajo */}
          <div />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-2 text-center border-l ${
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

        {/* Cuerpo scrollable */}
        <div
          className="overflow-y-auto grow"
          style={{ minHeight: 0, paddingBottom: "72px" }} // espacio para leyenda
        >
          <div
            className="grid grid-cols-[80px_repeat(7,1fr)] pt-10"
            style={{ height: 24 * 60 * PX_PER_MINUTE }}
          >
            {/* Horas */}
            <div className="relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border text-xs text-muted-foreground px-2"
                  style={{ height: 60 * PX_PER_MINUTE }}
                >
                  {hour.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Días */}
            {days.map((day) => {
              const dayAppointments = appointments.filter(
                (appt) =>
                  appt.status !== "cancelled" &&
                  isSameDay(new Date(appt.startAt), day),
              );

              return (
                <div
                  key={day.toISOString()}
                  className="relative border-l"
                  style={{ height: 24 * 60 * PX_PER_MINUTE }}
                >
                  {/* Clickable grid */}
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
                          isSelected ? "bg-primary/20" : "hover:bg-accent"
                        }`}
                        style={{ height: 60 * PX_PER_MINUTE }}
                      />
                    );
                  })}

                  {/* Current time */}
                  {isSameDay(day, today) && (
                    <div
                      ref={currentTimeRef}
                      className="absolute left-0 right-0 h-0.5 bg-red-500"
                      style={{
                        top: currentMinutes * PX_PER_MINUTE,
                      }}
                    />
                  )}

                  {/* Appointments */}
                  {dayAppointments.map((appt) => {
                    const start = new Date(appt.startAt);
                    const end = new Date(appt.endAt);

                    const startMinutes = getMinutesFromDate(start);
                    const endMinutes = getMinutesFromDate(end);

                    return (
                      <div
                        key={appt.id}
                        className={`absolute left-1 right-1 rounded text-xs p-1 shadow ${getAppointmentStyles(
                          appt.status,
                        )}`}
                        style={{
                          top: startMinutes * PX_PER_MINUTE,
                          height: (endMinutes - startMinutes) * PX_PER_MINUTE,
                        }}
                      >
                        <div className="font-medium truncate">
                          {appt.description ?? "Cita"}
                        </div>
                        <div className="opacity-80">
                          {format(start, "HH:mm")} - {format(end, "HH:mm")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pasamos callback para que CreateAppointmentButton avise cuando cree cita */}
      <CreateAppointmentButton
        selectedSlot={selectedSlot}
        onCreated={() => {
          fetchAppointments();
          setSelectedSlot(null); // limpiar selección al crear cita
        }}
      />
      
      {/* Leyenda sticky abajo dentro del contenedor */}
      <div className="sticky bottom-0 bg-background border-t py-2 flex justify-center gap-6 text-sm z-10 max-h-10 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
          <span className="leading-none">Programada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-green-500 inline-block" />
          <span className="leading-none">Completada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" />
          <span className="leading-none">No presentado</span>
        </div>
      </div>
    </div>
  );
}
