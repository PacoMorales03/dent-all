import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

async function verifyClinicMembership(userId: string, clinicId: string) {
  return prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
  });
}

// ✅ Auth + verificación de membresía
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  if (!clinicId) return NextResponse.json({ error: 'clinicId requerido' }, { status: 400 });

  const membership = await verifyClinicMembership(userId, clinicId);
  if (!membership) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const relations = await prisma.clinicDentists.findMany({
    where: { ClinicId: clinicId },
    include: { Dentist: { select: { id: true, name: true, surname: true } } },
  });

  return NextResponse.json(relations.map((r) => r.Dentist));
}

// ✅ Solo owners y admins pueden añadir dentistas
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { clinicId, dentistId } = await req.json();
  if (!clinicId || !dentistId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const membership = await verifyClinicMembership(userId, clinicId);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
  }

  const relation = await prisma.clinicDentists.create({
    data: { ClinicId: clinicId, DentistId: dentistId },
  });

  return NextResponse.json(relation, { status: 201 });
}