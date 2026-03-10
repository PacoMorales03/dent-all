"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function JoinClinicPopover({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!show) return null;

  async function handleJoin() {
    if (code.length < 8) return;

    // Reconstruir formato XXXX-XXXX para enviarlo a la API
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}`;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/join-clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: formatted }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al unirse a la clínica.");
        return;
      }

      setSuccess(`¡Te has unido a "${data.clinicName ?? "la clínica"}"!`);
      setTimeout(() => {
        onClose();
        router.push(`/platform/clinic/${data.clinicId}/dashboard`);
        router.refresh();
      }, 1500);
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
          Unirse a una clínica
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          Introduce el código de invitación que te ha proporcionado el administrador.
        </p>

        {/* InputOTP con separador central, igual que el formato XXXX-XXXX */}
        <div className="flex justify-center mb-4">
          <InputOTP
            maxLength={8}
            value={code}
            onChange={(val) => {
              setCode(val.toUpperCase());
              setError("");
            }}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            disabled={loading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
              <InputOTPSlot index={6} />
              <InputOTPSlot index={7} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center mb-3">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400 text-center mb-3">{success}</p>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleJoin}
            disabled={loading || code.length < 8}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Uniéndose...
              </span>
            ) : (
              "Unirse"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}