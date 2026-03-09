"use client";

import { CabinetGrid } from "@/components/cabinets/CabinetGrid";
import CreateCabinetPopover from "@/components/CreateCabinetPopover";


export default function Home() {
  return (
<div className="flex flex-col min-h-screen w-screen bg-zinc-50 font-sans dark:bg-black p-6">
  <div className="max-w-7xl w-full mx-auto">
    <div className="flex items-start justify-between mb-8">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Gabinetes
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
          Aquí puedes crear, editar y organizar todos los gabinetes de tu clínica.
        </p>
      </div>
      <div className="ml-4">
        <CreateCabinetPopover onCreated={() => {}} />
      </div>
    </div>

    <CabinetGrid />
  </div>
</div>
  );
}