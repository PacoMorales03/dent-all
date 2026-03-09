"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Label } from "@radix-ui/react-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreatePatientPopover from "@/components/CreatePatientPopover";

type Patient = {
  id: string;
  name?: string;
  surname?: string;
};

type Props = {
  value: string;
  onChange: (patientId: string) => void;
  disabled?: boolean;
  error?: string;
};

export default function SelectPatientsOnAppointments({
  value,
  onChange,
  disabled,
  error,
}: Props) {
  const pathname = usePathname();
  const clinicId = pathname.split("/")[3];

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;

    async function fetchPatients() {
      setLoading(true);
      setLoadError(null);

      try {
        const res = await fetch(`/api/clinic-patients?clinicId=${clinicId}`);
        if (!res.ok) {
          throw new Error("Error cargando pacientes");
        }

        const data = await res.json();
        setPatients(data);
      } catch (e) {
        setLoadError("No se pudieron cargar los pacientes");
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, [clinicId]);

  return (
    <div className="grid gap-1 relative">
      <Label>Paciente *</Label>

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full  min-w-55">
          <SelectValue
            placeholder={loading ? "Cargando pacientes..." : "Selecciona un paciente"}
          />
        </SelectTrigger>

        <SelectContent position="popper" className="z-50">
          {patients.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name} {p.surname}
            </SelectItem>
          ))}

          <div className="border-t mt-1 pt-1 px-2">
            <CreatePatientPopover
              onCreated={(newPatient) => {
                const patient = {
                  ...newPatient,
                  surname: newPatient.surname || "",
                };
                setPatients((prev) => [...prev, patient]);
                onChange(newPatient.id);
              }}
            />
          </div>
        </SelectContent>
      </Select>

      {(error || loadError) && (
        <p className="text-sm text-red-600">
          {error || loadError}
        </p>
      )}
    </div>
  );
}
