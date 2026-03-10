import { PatientsGrid } from "@/components/patients/Patientsgrid";

export default function PatientsPage() {
  return (
    <div className="flex flex-col min-h-screen w-screen bg-zinc-50 font-sans dark:bg-black p-6">
      <div className="max-w-7xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Pacientes
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Gestiona todos los pacientes de tu clínica, consulta su historial y citas.
          </p>
        </div>
        <PatientsGrid />
      </div>
    </div>
  );
}