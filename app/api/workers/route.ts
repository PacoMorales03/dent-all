import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

async function verifyAdmin(userId: string, clinicId: string) {
  return prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
    select: { role: true },
  });
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  if (!clinicId) return NextResponse.json({ error: "clinicId es obligatorio" }, { status: 400 });

  const membership = await verifyAdmin(userId, clinicId);
  if (!membership) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sin permisos suficientes" }, { status: 403 });
  }

  const workers = await prisma.clinicUser.findMany({
    where: { clinicId },
    include: {
      User: { select: { id: true, email: true } },
    },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json(
    workers.map((w) => ({
      userId: w.userId,
      email: w.User?.email ?? null,
      role: w.role,
      createdAt: w.created_at,
      isCurrentUser: w.userId === userId,
    }))
  );
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { clinicId, targetUserId, newRole } = body;

  if (!clinicId || !targetUserId || !newRole) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const VALID_ROLES = ["admin", "reception", "dentist"];
  if (!VALID_ROLES.includes(newRole)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const myMembership = await verifyAdmin(userId, clinicId);
  if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
    return NextResponse.json({ error: "Sin permisos suficientes" }, { status: 403 });
  }

  const targetMembership = await prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId: targetUserId } },
    select: { role: true },
  });

  if (!targetMembership) {
    return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
  }

  if (targetMembership.role === "owner") {
    return NextResponse.json({ error: "No se puede cambiar el rol del propietario" }, { status: 403 });
  }

  if (myMembership.role === "admin" && targetMembership.role === "admin") {
    return NextResponse.json({ error: "Solo el propietario puede cambiar el rol de un administrador" }, { status: 403 });
  }

  const updated = await prisma.clinicUser.update({
    where: { clinicId_userId: { clinicId, userId: targetUserId } },
    data: { role: newRole, updated_at: new Date() },
    select: { userId: true, role: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  const targetUserId = searchParams.get("targetUserId");

  if (!clinicId || !targetUserId) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const myMembership = await verifyAdmin(userId, clinicId);
  if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
    return NextResponse.json({ error: "Sin permisos suficientes" }, { status: 403 });
  }

  const targetMembership = await prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId: targetUserId } },
    select: { role: true },
  });

  if (!targetMembership) {
    return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
  }

  if (targetMembership.role === "owner") {
    return NextResponse.json({ error: "No se puede eliminar al propietario" }, { status: 403 });
  }

  if (userId === targetUserId) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 403 });
  }

  await prisma.clinicUser.delete({
    where: { clinicId_userId: { clinicId, userId: targetUserId } },
  });

  return NextResponse.json({ deleted: true });
}