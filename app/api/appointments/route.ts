import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/generated/prisma";

// Helper: verifica que el usuario pertenece a la clínica
async function verifyClinicMembership(userId: string, clinicId: string) {
  return prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
  });
}

// ✅ Solo devuelve citas de la clínica indicada, verificando membresía
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicID = searchParams.get("clinicID");
  const date = searchParams.get("date");

  if (!clinicID) {
    return NextResponse.json({ error: 'clinicID es requerido' }, { status: 400 });
  }

  const membership = await verifyClinicMembership(userId, clinicID);
  if (!membership) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const where: Prisma.AppointmentsWhereInput = { clinicID };

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.startAt = { gte: start, lt: end };
  }

  const appointments = await prisma.appointments.findMany({
    where,
    include: { Patient: true, Cabinets: true },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(appointments);
}

// ✅ Verifica membresía antes de crear la cita
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { clinicID, patientId, dentistId, cabinetId, description, startAt, endAt } = body;

  if (!clinicID || !patientId || !dentistId || !cabinetId || !startAt || !endAt) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  const membership = await verifyClinicMembership(userId, clinicID);
  if (!membership) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const appointment = await prisma.appointments.create({
    data: { clinicID, patientId, dentistId, cabinetId, description, startAt, endAt, status: "scheduled" },
  });

  return NextResponse.json(appointment, { status: 201 });
}