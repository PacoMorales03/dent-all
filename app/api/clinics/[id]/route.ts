import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

async function verifyMembership(userId: string, clinicId: string) {
  return prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
    select: { role: true },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id: clinicId } = await params;

  const membership = await verifyMembership(userId, clinicId);
  if (!membership) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true, phone: true, address: true },
  });

  if (!clinic) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 });

  return NextResponse.json(clinic);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id: clinicId } = await params;

  const membership = await verifyMembership(userId, clinicId);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sin permisos para editar la clínica" }, { status: 403 });
  }

  const body = await req.json();
  const { name, phone, address } = body;

  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const updated = await prisma.clinic.update({
    where: { id: clinicId },
    data: { name: name.trim(), phone: phone ?? null, address: address ?? null },
    select: { id: true, name: true, phone: true, address: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id: clinicId } = await params;

  const membership = await verifyMembership(userId, clinicId);
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Solo el propietario puede eliminar la clínica" }, { status: 403 });
  }

  await prisma.clinic.delete({ where: { id: clinicId } });

  return NextResponse.json({ deleted: true });
}