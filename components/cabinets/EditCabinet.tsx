"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Cabinet = {
  id: string;
  clinicId: string;
  num: number;
  description?: string;
};

type Props = {
  cabinet: Cabinet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedCabinet: Cabinet) => void;
};

export function EditCabinetDialog({ cabinet, open, onOpenChange, onSuccess }: Props) {
  const [description, setDescription] = useState(cabinet.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ FIX: si el usuario edita un gabinete, cierra y abre otro, el campo
  // mostraba la descripción del gabinete anterior (estado obsoleto).
  // Sincronizar cuando cambie cabinet o se abra el diálogo.
  useEffect(() => {
    if (open) {
      setDescription(cabinet.description ?? "");
      setError("");
    }
  }, [open, cabinet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/cabinets/${cabinet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Error al actualizar el gabinete");
      }

      const updatedCabinet: Cabinet = await res.json();
      onSuccess(updatedCabinet);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar el gabinete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Gabinete #{cabinet.num}</DialogTitle>
            <DialogDescription>Modifica la descripción del gabinete.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del gabinete (opcional)"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}