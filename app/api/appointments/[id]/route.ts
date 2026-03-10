import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";


async function verifyOwnership(userId: string, appointmentId: string) {
  const appt = await prisma.appointments.findUnique({
    where: { id: appointmentId },
    select: { clinicID: true },
  });
  if (!appt?.clinicID) return null;

  const membership = await prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId: appt.clinicID, userId } },
    select: { role: true },
  });

  return membership ? appt : null;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const owned = await verifyOwnership(userId, id);
  if (!owned) return NextResponse.json({ error: "Cita no encontrada o acceso denegado" }, { status: 404 });

  const body = await req.json();
  const { patientId, dentistId, cabinetId, description, startAt, endAt } = body;

  if (!patientId || !dentistId || !cabinetId || !startAt || !endAt) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const updated = await prisma.appointments.update({
    where: { id },
    data: {
      patientId,
      dentistId,
      cabinetId,
      description,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const owned = await verifyOwnership(userId, id);
  if (!owned) return NextResponse.json({ error: "Cita no encontrada o acceso denegado" }, { status: 404 });

  await prisma.appointments.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}