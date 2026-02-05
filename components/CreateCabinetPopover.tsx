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

type Cabinet = {
  id: string;
  clinicId: string;
  num: number;
  description?: string;
};

type Props = {
  onCreated: (cabinet: Cabinet) => void;
};

export default function CreateCabinetPopover({ onCreated }: Props) {
  const { id: clinicId } = useParams<{ id: string }>();

  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!clinicId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cabinets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const cabinet: Cabinet = await res.json();
      onCreated(cabinet);

      // reset
      setDescription("");
      setOpen(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error creando gabinete"
      );
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
          Crear nuevo gabinete
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        className="w-64 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid gap-2">
          <Label>Descripción</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            placeholder="Opcional"
          />

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
