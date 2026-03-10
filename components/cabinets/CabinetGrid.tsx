"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { IconDoor } from "@tabler/icons-react";
import { CabinetCard } from "./CabinetCard";
import CreateCabinetPopover from "../CreateCabinetPopover";

type Cabinet = {
  id: string;
  clinicId: string;
  num: number;
  description?: string;
};

export function CabinetGrid() {
  const { id: clinicId } = useParams<{ id: string }>();
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ useCallback para poder referenciar fetchCabinets en el efecto
  // sin recrearlo en cada render
  const fetchCabinets = useCallback(async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/cabinets?clinicId=${clinicId}`);
      if (!res.ok) throw new Error("Error al cargar los gabinetes");
      const data: Cabinet[] = await res.json();
      setCabinets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar los gabinetes");
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  // ✅ FIX: función async dentro del efecto para evitar el warning
  // react-hooks/set-state-in-effect
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clinicId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/cabinets?clinicId=${clinicId}`);
        if (!res.ok || cancelled) return;
        const data: Cabinet[] = await res.json();
        if (!cancelled) setCabinets(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Error al cargar los gabinetes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clinicId]);

  const handleCabinetCreated = (newCabinet: Cabinet) => {
    setCabinets(prev => [...prev, newCabinet].sort((a, b) => a.num - b.num));
  };

  const handleCabinetUpdated = (updatedCabinet: Cabinet) => {
    setCabinets(prev =>
      prev.map(cab => cab.id === updatedCabinet.id ? updatedCabinet : cab)
    );
  };

  const handleCabinetDeleted = (cabinetId: string) => {
    setCabinets(prev => prev.filter(cab => cab.id !== cabinetId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={fetchCabinets}
          className="mt-2 text-sm text-red-600 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ✅ FIX: botón de creación dentro de CabinetGrid con callback real,
          en lugar de en la página padre con onCreated={() => {}} vacío */}
      <div className="flex justify-end mb-4">
        <CreateCabinetPopover onCreated={handleCabinetCreated} />
      </div>

      {cabinets.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <IconDoor className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            No hay gabinetes
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Comienza creando tu primer gabinete
          </p>
          <CreateCabinetPopover onCreated={handleCabinetCreated} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cabinets.map((cabinet) => (
            <CabinetCard
              key={cabinet.id}
              cabinet={cabinet}
              onUpdate={handleCabinetUpdated}
              onDelete={handleCabinetDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}