import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const appointments = await prisma.appointments.findMany({
    include: {
      Clinic: true,
      Patient: true,
      Cabinets: true,
    },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const {
    clinicID,
    patientId,
    dentistId,
    cabinetId,
    description,
    startAt,
    endAt,
  } = body;

  const appointment = await prisma.appointments.create({
    data: {
      clinicID,
      patientId,
      dentistId,
      cabinetId,
      description,
      startAt,
      endAt,
      status: "scheduled",
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
