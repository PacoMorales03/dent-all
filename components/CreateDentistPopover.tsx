"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { IconUserPlus } from "@tabler/icons-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

type Dentist = {
  id: string;
  name?: string;
  surname?: string;
  specialty?: string;
};

type Props = {
  onCreated: (dentist: Dentist) => void;
};

export default function CreateDentistPopover({ onCreated }: Props) {
  const { id: clinicId } = useParams<{ id: string }>();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const dentistRes = await fetch("/api/dentists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          surname: surname.trim(),
          specialty: specialty.trim(),
        }),
      });

      if (!dentistRes.ok) {
        throw new Error(await dentistRes.text());
      }

      const dentist: Dentist = await dentistRes.json();

      const relationRes = await fetch("/api/clinicDentist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          dentistId: dentist.id,
        }),
      });

      if (!relationRes.ok) {
        throw new Error("Error vinculando dentista a clínica");
      }

      onCreated(dentist);

      // Reset
      setName("");
      setSurname("");
      setSpecialty("");
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creando dentista");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <IconUserPlus className="w-4 h-4" />
          Crear nuevo dentista
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        className="w-64 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid gap-2">
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />

          <Label>Apellidos</Label>
          <Input value={surname} onChange={(e) => setSurname(e.target.value)} />

          <Label>Especialidad</Label>
          <Input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={loading}>
              {loading ? "Creando..." : "Crear"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
