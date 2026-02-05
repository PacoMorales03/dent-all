"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import SelectDentistsOnAppointments from "./SelectDentistsOnAppointments";
import SelectCabinetsOnAppointments from "./SelectCabinetsOnAppointments";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import SelectPatientsOnAppointments from "./SelectPatiensOnAppointments";

type Props = {
  selectedSlot: { day: Date; hour: number } | null;
  onCreated: () => void; // callback para avisar a la agenda
};

export default function CreateAppointmentButton({
  selectedSlot,
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);

  // Formulario cita
  const [patient, setPatient] = useState<string>("");
  const [dentist, setDentist] = useState<string>("");
  const [cabinetId, setCabinetId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(""); // yyyy-mm-dd
  const [time, setTime] = useState(""); // HH:mm
  const [duration, setDuration] = useState("60"); // minutos

  // Errores
  const [errors, setErrors] = useState<{
    patient?: string;
    dentist?: string;
    cabinet?: string;
    description?: string;
    date?: string;
    time?: string;
    duration?: string;
    general?: string;
    duplicatePatient?: string;
    duplicateDentist?: string;
    duplicateCabinet?: string;
  }>({});

  const [loading, setLoading] = useState(false);

  // Actualiza fecha y hora cuando cambia selectedSlot
  useEffect(() => {
    if (selectedSlot) {
      const d = selectedSlot.day;
      const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const formattedDate = localDate.toLocaleDateString("en-CA"); // yyyy-mm-dd
      setDate(formattedDate);
      setTime(selectedSlot.hour.toString().padStart(2, "0") + ":00");
    }
  }, [selectedSlot]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!patient) newErrors.patient = "Paciente es obligatorio";
    if (!dentist) newErrors.dentist = "Dentista es obligatorio";
    if (!cabinetId) newErrors.cabinet = "Gabinete es obligatorio";
    if (!description.trim())
      newErrors.description = "Descripción es obligatoria";
    if (!date) newErrors.date = "Fecha es obligatoria";
    if (!time) newErrors.time = "Hora es obligatoria";
    if (!duration) newErrors.duration = "Duración es obligatoria";
    else if (isNaN(Number(duration)) || Number(duration) <= 0)
      newErrors.duration = "Duración debe ser un número positivo";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { id: clinicId } = useParams<{ id: string }>();

  const handleCreateAppointment = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const [hours, minutes] = time.split(":").map(Number);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);
      const startAt = startDate.toISOString();

      const endAtDate = new Date(startDate);
      endAtDate.setMinutes(endAtDate.getMinutes() + Number(duration));
      const endAt = endAtDate.toISOString();

      // Traemos citas existentes del día para la clínica
      const existingRes = await fetch(
        `/api/appointments?clinicID=${clinicId}&date=${date}`,
      );
      if (!existingRes.ok) {
        setErrors({ general: "No se pudieron obtener las citas existentes" });
        setLoading(false);
        return;
      }
      const existingAppointments: {
        id: string;
        dentistId: string;
        cabinetId: string;
        patientId: string;
        startAt: string;
        endAt: string;
      }[] = await existingRes.json();

      const overlaps = (start1: Date, end1: Date, start2: Date, end2: Date) =>
        start1 < end2 && start2 < end1;

      // Comprobar superposición para dentista, gabinete y paciente
      for (const appt of existingAppointments) {
        if (
          overlaps(
            startDate,
            endAtDate,
            new Date(appt.startAt),
            new Date(appt.endAt),
          )
        ) {
          const newErrors: typeof errors = {};

          if (appt.dentistId === dentist) {
            newErrors.duplicateDentist =
              "Ya existe una cita que se superpone para este dentista.";
          }
          if (appt.cabinetId === cabinetId) {
            newErrors.duplicateCabinet =
              "Ya existe una cita que se superpone para este gabinete.";
          }
          if (appt.patientId === patient) {
            newErrors.duplicatePatient =
              "Ya existe una cita que se superpone para este paciente.";
          }

          setErrors(newErrors);
          setLoading(false);
          return;
        }
      }

      // Crear cita porque no hay conflicto
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicID: clinicId,
          patientId: patient,
          dentistId: dentist,
          cabinetId,
          description,
          startAt,
          endAt,
          status: "scheduled",
        }),
      });

      if (!res.ok) {
        const errMsg = await res.text();
        setErrors({ general: errMsg || "Error creando la cita" });
        setLoading(false);
        return;
      }

      // Reset y cerrar modal
      setOpen(false);
      resetForm();

      onCreated();
    } catch {
      setErrors({ general: "Error de red o servidor" });
    } finally {
      setLoading(false);
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setPatient("");
    setDentist("");
    setCabinetId("");
    setDescription("");
    setDate("");
    setTime("");
    setDuration("60");
    setErrors({});
    setLoading(false);
  };

  const getFirstErrorMessage = () => {
    if (errors.duplicateDentist) return errors.duplicateDentist;
    if (errors.duplicateCabinet) return errors.duplicateCabinet;
    if (errors.duplicatePatient) return errors.duplicatePatient;
    return null;
  };

  const errorMessage = getFirstErrorMessage();

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <SheetTrigger asChild>
        <Button
          className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full w-14 h-14 shadow-lg text-2xl hover:scale-105 transition z-20"
          aria-label="Create Appointment"
        >
          <IconPlus className="w-6 h-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="h-auto overflow-auto">
        <SheetHeader>
          <SheetTitle>Crear Cita</SheetTitle>
          <SheetDescription>Rellena los detalles de la cita.</SheetDescription>
        </SheetHeader>

        <Popover open={!!errorMessage}>
          <PopoverTrigger asChild>
            <div>
              <div className="grid flex-1 auto-rows-min gap-4 px-4">
                <SelectPatientsOnAppointments
                  value={patient}
                  onChange={setPatient}
                  disabled={loading}
                  error={errors.patient}
                />

                <SelectDentistsOnAppointments
                  value={dentist}
                  onChange={setDentist}
                  disabled={loading}
                  error={errors.dentist}
                />

                <SelectCabinetsOnAppointments
                  value={cabinetId}
                  onChange={setCabinetId}
                  error={errors.cabinet}
                  disabled={loading}
                />

                {/* Descripción */}
                <div className="grid gap-1">
                  <Label htmlFor="description">Descripción *</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    placeholder="Detalles de la cita"
                    aria-invalid={!!errors.description}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Fecha */}
                <div className="grid gap-1">
                  <Label htmlFor="date">Fecha *</Label>
                  <Input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={loading}
                    aria-invalid={!!errors.date}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-600">{errors.date}</p>
                  )}
                </div>

                {/* Hora */}
                <div className="grid gap-1">
                  <Label htmlFor="time">Hora *</Label>
                  <Input
                    type="time"
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    disabled={loading}
                    aria-invalid={!!errors.time}
                  />
                  {errors.time && (
                    <p className="text-sm text-red-600">{errors.time}</p>
                  )}
                </div>

                {/* Duración */}
                <div className="grid gap-1">
                  <Label htmlFor="duration">Duración (minutos) *</Label>
                  <Input
                    type="number"
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={loading}
                    min={1}
                    aria-invalid={!!errors.duration}
                  />
                  {errors.duration && (
                    <p className="text-sm text-red-600">{errors.duration}</p>
                  )}
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            className="max-w-md p-4 bg-red-100 text-red-700 rounded-md shadow-lg"
          >
            {errorMessage}
          </PopoverContent>
        </Popover>

        <SheetFooter>
          <Button
            type="submit"
            onClick={handleCreateAppointment}
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear"}
          </Button>
          <SheetClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
