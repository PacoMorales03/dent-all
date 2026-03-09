"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconDoor, IconPlus } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Cabinet = {
  id: string;
  clinicId: string;
  num: number;
  description?: string;
};

type Props = {
  onCreated: (cabinet: Cabinet) => void;
};

export default function CreateCabinetPopOver({ onCreated }: Props) {
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

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset cuando se cierra sin crear
        setDescription("");
        setError("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <IconPlus className="w-4 h-4" />
          Nuevo gabinete
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconDoor className="w-5 h-5" />
            Crear nuevo gabinete
          </DialogTitle>
          <DialogDescription>
            Completa la información para crear un nuevo gabinete en tu clínica.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              La descripción es opcional. El número se asignará automáticamente.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleCreate}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>Creando...</>
            ) : (
              <>
                <IconPlus className="w-4 h-4" />
                Crear gabinete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}