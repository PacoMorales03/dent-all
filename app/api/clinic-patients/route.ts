import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  if (!clinicId) return NextResponse.json({ error: "clinicId requerido" }, { status: 400 });

  const membership = await prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
  });
  if (!membership) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const relations = await prisma.clinicPatients.findMany({
    where: { clinicId },
    include: {
      Patient: {
        select: { id: true, name: true, surname: true, phone: true },
      },
    },
  });

  return NextResponse.json(relations.map((r) => r.Patient));
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { clinicId, patientId } = await req.json();

  if (!clinicId || !patientId) {
    return NextResponse.json({ error: "clinicId y patientId son obligatorios" }, { status: 400 });
  }

  const membership = await prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
  });
  if (!membership) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const existing = await prisma.clinicPatients.findUnique({
    where: { clinicId_PatientId: { clinicId, PatientId: patientId } },
  });

  if (existing) {
    return NextResponse.json({ error: "El paciente ya está vinculado a esta clínica" }, { status: 409 });
  }

  const relation = await prisma.clinicPatients.create({
    data: { clinicId, PatientId: patientId },
  });

  return NextResponse.json(relation, { status: 201 });
}