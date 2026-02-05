import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");

  if (!clinicId) {
    return new NextResponse("clinicId is required", { status: 400 });
  }

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
