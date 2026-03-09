import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { userId } = await auth(); // ← añadir esto
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  if (!clinicId) return NextResponse.json({ error: 'clinicId requerido' }, { status: 400 });

  // ← añadir verificación de membresía
  const membership = await prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
  });
  if (!membership) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });


  const relations = await prisma.clinicPatients.findMany({
    where: {
      clinicId,
    },
    include: {
      Patient: {
        select: {
          id: true,
          name: true,
          surname: true,
          phone: true,
        },
      },
    },
  });

  const patients = relations.map((r) => r.Patient);

  return NextResponse.json(patients);
}


export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { clinicId, patientId } = await req.json();

  const relation = await prisma.clinicPatients.create({
    data: {
      clinicId,
      PatientId: patientId,
    },
  });

  return NextResponse.json(relation, { status: 201 });
}
