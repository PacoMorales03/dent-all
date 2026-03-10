import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// POST /api/join-clinic
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { code } = body;

  if (!code?.trim()) {
    return NextResponse.json({ error: "El código es obligatorio" }, { status: 400 });
  }

  // Normalizar: mayúsculas, sin espacios, aseguramos el guion en posición 4
  const normalizedCode = code.trim().toUpperCase().replace(/\s/g, "");

  // Buscar directamente por id (que ahora es el código "XXXX-XXXX")
  const invite = await prisma.clinicInviteCode.findUnique({
    where: { id: normalizedCode },
    include: { Clinic: { select: { id: true, name: true } } },
  });

  if (!invite) {
    return NextResponse.json({ error: "Código de invitación inválido" }, { status: 404 });
  }

  // Verificar expiración
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: "El código ha expirado" }, { status: 410 });
  }

  if (!invite.clinicId) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  // Verificar si ya es miembro
  const existing = await prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId: invite.clinicId, userId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Ya eres miembro de esta clínica" }, { status: 409 });
  }

  // Asegurar que el usuario existe en la tabla User
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  const newMember = await prisma.clinicUser.create({
    data: {
      clinicId: invite.clinicId,
      userId,
      role: invite.role ?? "reception",
    },
  });

  return NextResponse.json({
    clinicId: invite.clinicId,
    clinicName: invite.Clinic?.name,
    role: newMember.role,
  }, { status: 201 });
}