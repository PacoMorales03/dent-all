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
import CreateCabinetPopover from "@/components/CreateCabinetPopover";

type Cabinet = {
  id: string;
  num: number;
  description?: string;
};

type Props = {
  value: string;
  onChange: (cabinetId: string) => void;
  disabled?: boolean;
  error?: string;
};

export default function SelectCabinetsOnAppointments({
  value,
  onChange,
  disabled,
  error,
}: Props) {
  const pathname = usePathname();
  const clinicId = pathname.split("/")[3];

  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;

    async function fetchCabinets() {
      setLoading(true);
      setLoadError(null);

      try {
        const res = await fetch(`/api/cabinets?clinicId=${clinicId}`);
        if (!res.ok) {
          throw new Error("Error cargando gabinetes");
        }

        const data = await res.json();

        // opcional: ordenar por número
        data.sort((a: Cabinet, b: Cabinet) => a.num - b.num);

        setCabinets(data);
      } catch {
        setLoadError("No se pudieron cargar los gabinetes");
      } finally {
        setLoading(false);
      }
    }

    fetchCabinets();
  }, [clinicId]);

  return (
    <div className="grid gap-1 relative">
      <Label>Gabinete *</Label>

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              loading
                ? "Cargando gabinetes..."
                : "Selecciona un gabinete"
            }
          />
        </SelectTrigger>

        <SelectContent position="popper" className="z-50">
          {cabinets.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              Gabinete {c.num}
              {c.description ? ` — ${c.description}` : ""}
            </SelectItem>
          ))}

          <div className="border-t mt-1 pt-1 px-2">
            <CreateCabinetPopover
              onCreated={(newCabinet) => {
                setCabinets((prev) =>
                  [...prev, newCabinet].sort(
                    (a, b) => a.num - b.num
                  )
                );
                onChange(newCabinet.id);
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
