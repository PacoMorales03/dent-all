"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function SelectDentistsOnAppointments({ value, onChange, disabled, error }: Props) {
  // FIX: useParams en lugar de pathname.split("/")[3]
  const { id: clinicId } = useParams<{ id: string }>();

  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;

    async function fetchDentists() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/clinicDentist?clinicId=${clinicId}`);
        if (!res.ok) throw new Error("Error cargando dentistas");
        const data = await res.json();
        if (!cancelled) setDentists(data);
      } catch {
        if (!cancelled) setLoadError("No se pudieron cargar los dentistas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDentists();
    return () => { cancelled = true; };
  }, [clinicId]);

  return (
    <div className="grid gap-1 relative">
      <Label>Dentista *</Label>

      <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger className="w-full min-w-55">
          <SelectValue placeholder={loading ? "Cargando dentistas..." : "Selecciona un dentista"} />
        </SelectTrigger>

        <SelectContent position="popper" className="z-50">
          {dentists.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name} {d.surname}
            </SelectItem>
          ))}

          <div className="border-t mt-1 pt-1 px-2">
            <CreateDentistPopover
              onCreated={(newDentist) => {
                setDentists((prev) => [...prev, { ...newDentist, surname: newDentist.surname ?? "" }]);
                onChange(newDentist.id);
              }}
            />
          </div>
        </SelectContent>
      </Select>

      {(error || loadError) && (
        <p className="text-sm text-red-600">{error || loadError}</p>
      )}
    </div>
  );
}