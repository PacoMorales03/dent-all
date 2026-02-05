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
import CreateDentistPopover from "@/components/CreateDentistPopover";

type Dentist = {
  id: string;
  name?: string;
  surname?: string;
};

type Props = {
  value: string;
  onChange: (dentistId: string) => void;
  disabled?: boolean;
  error?: string;
};

export default function SelectDentistsOnAppointments({
  value,
  onChange,
  disabled,
  error,
}: Props) {
  const pathname = usePathname();
  const clinicId = pathname.split("/")[3]; // /platform/clinic/[id]/...

  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;

    async function fetchDentists() {
      setLoading(true);
      setLoadError(null);

      try {
        const res = await fetch(
          `/api/clinicDentist?clinicId=${clinicId}`
        );

        if (!res.ok) {
          throw new Error("Error cargando dentistas");
        }

        const data = await res.json();
        setDentists(data);
      } catch {
        setLoadError("No se pudieron cargar los dentistas");
      } finally {
        setLoading(false);
      }
    }

    fetchDentists();
  }, [clinicId]);

  return (
    <div className="grid gap-1 relative">
      <Label>Dentista *</Label>

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              loading
                ? "Cargando dentistas..."
                : "Selecciona un dentista"
            }
          />
        </SelectTrigger>

        <SelectContent position="popper" className="z-50">
          {dentists.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name} {d.surname}
            </SelectItem>
          ))}

          <div className="border-t mt-1 pt-1 px-2">
            <CreateDentistPopover
              onCreated={async (newDentist) => {
                // Crear relación clínica-dentista
                await fetch("/api/clinicDentist", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    clinicId,
                    dentistId: newDentist.id,
                  }),
                });

                const dentist = {
                  ...newDentist,
                  surname: newDentist.surname || "",
                };

                setDentists((prev) => [...prev, dentist]);
                onChange(newDentist.id);
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
