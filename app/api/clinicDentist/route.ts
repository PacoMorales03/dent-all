import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");

  if (!clinicId) {
    return new NextResponse("clinicId is required", { status: 400 });
  }

  const relations = await prisma.clinicDentists.findMany({
    where: {
      ClinicId: clinicId,
    },
    include: {
      Dentist: {
        select: {
          id: true,
          name: true,
          surname: true,
        },
      },
    },
  });

  const dentists = relations.map((r) => r.Dentist);

  return NextResponse.json(dentists);
}


export async function POST(req: Request) {
  const { clinicId, dentistId } = await req.json();

  if (!clinicId || !dentistId) {
    return new NextResponse("Missing data", { status: 400 });
  }

  const relation = await prisma.clinicDentists.create({
    data: {
      ClinicId: clinicId,
      DentistId: dentistId,
    },
  });

  return NextResponse.json(relation, { status: 201 });
}
