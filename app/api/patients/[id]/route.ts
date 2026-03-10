import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

async function verifyPatientAccess(userId: string, patientId: string) {
  const relation = await prisma.clinicPatients.findFirst({
    where: {
      PatientId: patientId,
      Clinic: { ClinicUser: { some: { userId } } },
    },
    select: { clinicId: true },
  });
  return relation;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const access = await verifyPatientAccess(userId, id);
  if (!access) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = await req.json();
  const { name, surname, phone } = body;

  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const updated = await prisma.patient.update({
    where: { id },
    data: { name: name.trim(), surname: surname ?? null, phone: phone ?? null },
    select: { id: true, name: true, surname: true, phone: true },
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

  const access = await verifyPatientAccess(userId, id);
  if (!access) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  await prisma.patient.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}