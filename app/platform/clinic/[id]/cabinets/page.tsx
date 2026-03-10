import { CabinetGrid } from "@/components/cabinets/CabinetGrid";

export default function CabinetsPage() {
  return (
    <div className="flex flex-col min-h-screen w-screen bg-zinc-50 font-sans dark:bg-black p-6">
      <div className="max-w-7xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Gabinetes
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Aquí puedes crear, editar y organizar todos los gabinetes de tu clínica.
          </p>
        </div>

        {/* CabinetGrid gestiona internamente el botón de creación */}
        <CabinetGrid />
      </div>
    </div>
  );
}