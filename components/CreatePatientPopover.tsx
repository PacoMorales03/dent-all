"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconUserPlus, IconUser, IconPhone } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Patient = {
  id: string;
  name: string;
  surname?: string;
  phone?: string;
};

type Props = {
  onCreated: (patient: Patient) => void;
};

export default function CreatePatientPopover({ onCreated }: Props) {
  const { id: clinicId } = useParams<{ id: string }>();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
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
      const patientRes = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          surname: surname.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });

      if (!patientRes.ok) {
        throw new Error(await patientRes.text());
      }

      const patient: Patient = await patientRes.json();

      const relationRes = await fetch("/api/clinic-patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          patientId: patient.id,
        }),
      });

      if (!relationRes.ok) {
        throw new Error("Error vinculando paciente a clínica");
      }

      onCreated(patient);

      // Reset
      setName("");
      setSurname("");
      setPhone("");
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creando paciente");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset cuando se cierra sin crear
        setName("");
        setSurname("");
        setPhone("");
        setError("");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <IconUserPlus className="w-4 h-4" />
          Crear nuevo paciente
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-106.25" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <IconUser className="w-5 h-5" />
            Nuevo paciente
          </DialogTitle>
          <DialogDescription>
            Añade un nuevo paciente a tu clínica. El nombre es el único campo obligatorio.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="flex items-center gap-1">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: María"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="surname">Apellidos</Label>
            <Input
              id="surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="Ej: García López"
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <IconPhone className="w-4 h-4" />
              Teléfono
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: 600 123 456"
              disabled={loading}
              type="tel"
            />
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
            disabled={loading || !name.trim()}
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creando...
              </>
            ) : (
              <>
                <IconUserPlus className="w-4 h-4" />
                Crear paciente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}