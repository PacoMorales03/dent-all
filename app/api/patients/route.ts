import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";


export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const patients = await prisma.patient.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
      surname: true,
      phone: true,
    },
  });

  return NextResponse.json(patients);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { name, surname, phone } = body;

  if (!name) {
    return new NextResponse("Name is required", { status: 400 });
  }

  const patient = await prisma.patient.create({
    data: {
      name,
      surname,
      phone,
    },
    select: {
      id: true,
      name: true,
      surname: true,
      phone: true,
    },
  });

  return NextResponse.json(patient, { status: 201 });
}
