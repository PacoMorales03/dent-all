import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  return NextResponse.json(
    { error: "Para listar pacientes de una clinica usa GET /api/clinic-patients?clinicId=..." },
    { status: 405 }
  );
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { name, surname, phone, clinicId } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  if (!clinicId) {
    return NextResponse.json({ error: "clinicId es obligatorio" }, { status: 400 });
  }

  const membership = await prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
    select: { role: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const patient = await prisma.$transaction(async (tx) => {
    const p = await tx.patient.create({
      data: {
        name: name.trim(),
        surname: surname?.trim() || null,
        phone: phone?.trim() || null,
      },
      select: { id: true, name: true, surname: true, phone: true },
    });
    const existing = await tx.clinicPatients.findUnique({
      where: { clinicId_PatientId: { clinicId, PatientId: p.id } },
    });

    if (!existing) {
      await tx.clinicPatients.create({
        data: { clinicId, PatientId: p.id },
      });
    }

    return p;
  });

  return NextResponse.json(patient, { status: 201 });
}