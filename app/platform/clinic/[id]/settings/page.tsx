import { ClinicSettings } from "@/components/settings/Clinicsettings";

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen w-screen bg-zinc-50 font-sans dark:bg-black p-6">
      <div className="max-w-4xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Ajustes
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Configura los datos de tu clínica, horarios, notificaciones y más.
          </p>
        </div>
        <ClinicSettings />
      </div>
    </div>
  );
}