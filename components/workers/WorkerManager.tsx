"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  IconUsers,
  IconShield,
  IconLink,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconTrash,
  IconClock,
  IconUserMinus,
  IconAlertTriangle,
  IconUserShield,
} from "@tabler/icons-react";

type ClinicRole = "owner" | "admin" | "reception" | "dentist";

type Worker = {
  userId: string;
  email: string | null;
  role: ClinicRole;
  createdAt: string | null;
  isCurrentUser: boolean;
};

type InviteCode = {
  id: string;
  clinicId: string | null;
  role: ClinicRole | null;
  expiresAt: string | null;
  createdBy: string | null;
};

const ROLE_LABELS: Record<ClinicRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  reception: "Recepción",
  dentist: "Dentista",
};

const ROLE_COLORS: Record<ClinicRole, string> = {
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  reception: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  dentist: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const EDITABLE_ROLES: ClinicRole[] = ["admin", "reception", "dentist"];

function getInitials(email: string | null): string {
  if (!email) return "?";
  return email.substring(0, 2).toUpperCase();
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "Sin expiración";
  const date = new Date(expiresAt);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return "Expirado";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `Expira en ${hours}h ${mins}m`;
  return `Expira en ${mins}m`;
}

export function WorkersManager() {
  const { id: clinicId } = useParams<{ id: string }>();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [invite, setInvite] = useState<InviteCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [inviteRole, setInviteRole] = useState<ClinicRole>("reception");
  const [inviteHours, setInviteHours] = useState(24);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<string | null>(null);

  const myRole = workers.find((w) => w.isCurrentUser)?.role ?? "reception";
  const canManage = ["owner", "admin"].includes(myRole);

  const fetchData = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [wRes, iRes] = await Promise.all([
        fetch(`/api/workers?clinicId=${clinicId}`),
        fetch(`/api/invite-code?clinicId=${clinicId}`),
      ]);
      if (wRes.ok) setWorkers(await wRes.json());
      if (iRes.ok) {
        const data = await iRes.json();
        setInvite(data);
      }
    } catch {
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh del tiempo de expiración
  useEffect(() => {
    const interval = setInterval(() => {
      setInvite((prev) => (prev ? { ...prev } : null));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleRoleChange(targetUserId: string, newRole: string) {
    setUpdatingRole(targetUserId);
    try {
      const res = await fetch("/api/workers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId, targetUserId, newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al actualizar el rol");
        return;
      }
      setWorkers((prev) =>
        prev.map((w) =>
          w.userId === targetUserId ? { ...w, role: newRole as ClinicRole } : w
        )
      );
    } catch {
      setError("Error al actualizar el rol");
    } finally {
      setUpdatingRole(null);
    }
  }

  async function handleRemoveWorker(targetUserId: string) {
    setDeletingWorker(targetUserId);
    try {
      const res = await fetch(
        `/api/workers?clinicId=${clinicId}&targetUserId=${targetUserId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al eliminar al trabajador");
        return;
      }
      setWorkers((prev) => prev.filter((w) => w.userId !== targetUserId));
    } catch {
      setError("Error al eliminar al trabajador");
    } finally {
      setDeletingWorker(null);
    }
  }

  async function handleGenerateCode() {
    setGeneratingCode(true);
    setError("");
    try {
      const res = await fetch("/api/invite-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId, role: inviteRole, expiresInHours: inviteHours }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al generar el código");
        return;
      }
      const data = await res.json();
      setInvite(data);
    } catch {
      setError("Error al generar el código");
    } finally {
      setGeneratingCode(false);
    }
  }

  async function handleRevokeCode() {
    try {
      await fetch(`/api/invite-code?clinicId=${clinicId}`, { method: "DELETE" });
      setInvite(null);
    } catch {
      setError("Error al revocar el código");
    }
  }

  function handleCopy() {
    if (!invite?.id) return;
    navigator.clipboard.writeText(invite.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isExpired = invite?.expiresAt
    ? new Date(invite.expiresAt) < new Date()
    : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <IconAlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Sección Trabajadores ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <IconUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Equipo de la clínica
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {workers.length} miembro{workers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {workers.map((worker) => {
            const canEdit =
              canManage &&
              !worker.isCurrentUser &&
              worker.role !== "owner" &&
              !(myRole === "admin" && worker.role === "admin");

            return (
              <div
                key={worker.userId}
                className="px-6 py-4 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {getInitials(worker.email)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {worker.email ?? "Usuario sin email"}
                    {worker.isCurrentUser && (
                      <span className="ml-2 text-xs text-zinc-400">(tú)</span>
                    )}
                  </p>
                  {worker.createdAt && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Miembro desde{" "}
                      {new Date(worker.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                {/* Role badge / selector */}
                {canEdit ? (
                  <Select
                    value={worker.role}
                    onValueChange={(v) => handleRoleChange(worker.userId, v)}
                    disabled={updatingRole === worker.userId}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EDITABLE_ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">
                          <div className="flex items-center gap-2">
                            <IconUserShield className="w-3 h-3" />
                            {ROLE_LABELS[r]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[worker.role]}`}
                  >
                    {ROLE_LABELS[worker.role]}
                  </span>
                )}

                {/* Botón eliminar */}
                {canEdit && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        disabled={deletingWorker === worker.userId}
                      >
                        {deletingWorker === worker.userId ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                        ) : (
                          <IconUserMinus className="w-4 h-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar trabajador?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará a <strong>{worker.email}</strong> de la
                          clínica. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveWorker(worker.userId)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })}

          {workers.length === 0 && (
            <div className="px-6 py-12 text-center">
              <IconUsers className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No hay trabajadores en esta clínica</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sección Código de Invitación ── */}
      {canManage && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <IconLink className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Código de invitación
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Comparte este código para que nuevos usuarios se unan a la clínica
              </p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Código actual */}
            {invite && !isExpired ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-5 py-4">
                    <p className="text-2xl font-mono font-bold tracking-[0.3em] text-zinc-900 dark:text-zinc-50 text-center">
                      {invite.id}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 shrink-0"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <IconCheck className="w-5 h-5 text-green-500" />
                    ) : (
                      <IconCopy className="w-5 h-5" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <IconShield className="w-3.5 h-3.5" />
                    <span>
                      Rol:{" "}
                      <strong className="text-zinc-700 dark:text-zinc-300">
                        {ROLE_LABELS[invite.role ?? "reception"]}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IconClock className="w-3.5 h-3.5" />
                    <span>{formatExpiry(invite.expiresAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleGenerateCode}
                    disabled={generatingCode}
                  >
                    <IconRefresh className={`w-4 h-4 ${generatingCode ? "animate-spin" : ""}`} />
                    Renovar código
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleRevokeCode}
                  >
                    <IconTrash className="w-4 h-4" />
                    Revocar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                {isExpired && invite && (
                  <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm px-4 py-2 rounded-lg mb-4">
                    <IconClock className="w-4 h-4" />
                    El código anterior ha expirado
                  </div>
                )}
                <p className="text-sm text-zinc-500 mb-4">
                  No hay ningún código de invitación activo
                </p>
              </div>
            )}

            {/* Configuración para generar */}
            {(!invite || isExpired) && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-4">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Generar nuevo código
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500">Rol del invitado</label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as ClinicRole)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EDITABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-sm">
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500">Duración</label>
                    <Select
                      value={String(inviteHours)}
                      onValueChange={(v) => setInviteHours(Number(v))}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hora</SelectItem>
                        <SelectItem value="6">6 horas</SelectItem>
                        <SelectItem value="24">24 horas</SelectItem>
                        <SelectItem value="72">3 días</SelectItem>
                        <SelectItem value="168">7 días</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  className="w-full gap-2"
                >
                  {generatingCode ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <IconLink className="w-4 h-4" />
                  )}
                  {generatingCode ? "Generando..." : "Generar código de invitación"}
                </Button>
              </div>
            )}

            {/* Si ya hay código, mostrar configuración para regenerar */}
            {invite && !isExpired && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-3">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Configuración al renovar
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500">Rol del invitado</label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as ClinicRole)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EDITABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-sm">
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-500">Nueva duración</label>
                    <Select
                      value={String(inviteHours)}
                      onValueChange={(v) => setInviteHours(Number(v))}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hora</SelectItem>
                        <SelectItem value="6">6 horas</SelectItem>
                        <SelectItem value="24">24 horas</SelectItem>
                        <SelectItem value="72">3 días</SelectItem>
                        <SelectItem value="168">7 días</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}