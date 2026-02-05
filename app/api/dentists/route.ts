// POST /api/dentists
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, surname, phone, specialty } = body;

  if (!name) {
    return new NextResponse("Name is required", { status: 400 });
  }

  const dentist = await prisma.dentist.create({
    data: {
      name,
      surname,
      phone,
      specialty,
    },
    select: {
      id: true,
      name: true,
      surname: true,
      specialty: true,
    },
  });

  return NextResponse.json(dentist, { status: 201 });
}
