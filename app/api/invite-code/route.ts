import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";

// Genera un código legible de 9 chars: XXXX-XXXX
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O,0,I,1
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
    if (i === 3) code += "-";
  }
  return code; // ej: "ABCD-EFGH" → 9 chars, encaja en VarChar(9)
}

async function verifyOwnerOrAdmin(userId: string, clinicId: string) {
  return prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
    select: { role: true },
  });
}

// GET /api/invite-code?clinicId=xxx
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  if (!clinicId) return NextResponse.json({ error: "clinicId es obligatorio" }, { status: 400 });

  const membership = await verifyOwnerOrAdmin(userId, clinicId);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sin permisos suficientes" }, { status: 403 });
  }

  const inviteCode = await prisma.clinicInviteCode.findUnique({
    where: { clinicId },
  });

  return NextResponse.json(inviteCode ?? null);
}

// POST /api/invite-code → genera o renueva el código
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { clinicId, role = "reception", expiresInHours = 24 } = body;

  if (!clinicId) return NextResponse.json({ error: "clinicId es obligatorio" }, { status: 400 });

  const VALID_ROLES = ["admin", "reception", "dentist"];
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const membership = await verifyOwnerOrAdmin(userId, clinicId);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sin permisos suficientes" }, { status: 403 });
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const code = generateCode(); // "XXXX-XXXX", 9 chars

  // Borrar anterior y crear nuevo con el código como id
  await prisma.clinicInviteCode.deleteMany({ where: { clinicId } });

  const newInvite = await prisma.clinicInviteCode.create({
    data: {
      id: code,           // VarChar(9) ✅
      clinicId,
      role,
      expiresAt: expiresAt.toISOString(),
      createdBy: userId,
    },
  });

  return NextResponse.json(newInvite, { status: 201 });
}

// DELETE /api/invite-code?clinicId=xxx
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  if (!clinicId) return NextResponse.json({ error: "clinicId es obligatorio" }, { status: 400 });

  const membership = await verifyOwnerOrAdmin(userId, clinicId);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sin permisos suficientes" }, { status: 403 });
  }

  await prisma.clinicInviteCode.deleteMany({ where: { clinicId } });

  return NextResponse.json({ deleted: true });
}