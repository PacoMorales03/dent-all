"use client";

import { useState, useEffect, useRef } from "react";
import { format, startOfWeek, addDays, addWeeks, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PX_PER_MINUTE = 1.2; // escala vertical
const VISIBLE_MINUTES = 60 * 5; // 5h visibles
const CONTAINER_HEIGHT = VISIBLE_MINUTES * PX_PER_MINUTE;

type Appointment = {
  id: string;
  day: Date;
  startMinutes: number; // desde 00:00
  endMinutes: number;
  title: string;
};

type SelectedSlot = {
  day: Date;
  hour: number;
};



export default function WeeklyAgenda() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const today = new Date();
  const currentMinutes = today.getHours() * 60 + today.getMinutes();

  const currentTimeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTimeRef.current) {
      currentTimeRef.current.scrollIntoView({
        block: "center",
      });
    }
  }, []);

  return (
    <div className="w-full flex justify-center px-4">
      <div className="w-full max-w-7xl">
        <div className="border rounded-lg p-6 space-y-4 bg-background">
          {/* CONTROLES */}
          <div className="flex justify-between items-center">
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

          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-muted text-sm font-medium">
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
                  <div className="text-xs opacity-80">
                    {format(day, "dd/MM")}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="overflow-y-auto"
              style={{ height: CONTAINER_HEIGHT }}
            >
              <div className="grid grid-cols-[80px_repeat(7,1fr)]">
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="border-t text-xs text-muted-foreground px-2"
                      style={{ height: 60 * PX_PER_MINUTE }}
                    >
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="relative border-l"
                    style={{ height: 24 * 60 * PX_PER_MINUTE }}
                  >
                    {/* GRID CLICKABLE */}
                    {HOURS.map((hour) => {
                      const isSelected =
                        selectedSlot &&
                        isSameDay(selectedSlot.day, day) &&
                        selectedSlot.hour === hour;

                      return (
                        <div
                          key={hour}
                          onClick={() => setSelectedSlot({ day, hour })}
                          className={`border-t cursor-pointer ${
                            isSelected ? "bg-primary/20" : "hover:bg-accent"
                          }`}
                          style={{
                            height: 60 * PX_PER_MINUTE,
                          }}
                        />
                      );
                    })}

                    {isSameDay(day, today) && (
                      <div
                        ref={currentTimeRef}
                        className="absolute left-0 right-0 h-0.5 bg-red-500"
                        style={{
                          top: currentMinutes * PX_PER_MINUTE,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
