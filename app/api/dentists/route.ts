import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { name, surname, phone, specialty, clinicId } = body;

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

  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sin permisos para añadir dentistas" }, { status: 403 });
  }

  const [dentist] = await prisma.$transaction([
    prisma.dentist.create({
      data: { name: name.trim(), surname: surname?.trim(), phone, specialty: specialty?.trim() },
      select: { id: true, name: true, surname: true, specialty: true },
    }),
  ]);


  const result = await prisma.$transaction(async (tx) => {
    const d = await tx.dentist.create({
      data: { name: name.trim(), surname: surname?.trim(), phone, specialty: specialty?.trim() },
      select: { id: true, name: true, surname: true, specialty: true },
    });

    await tx.clinicDentists.create({
      data: { ClinicId: clinicId, DentistId: d.id },
    });

    return d;
  });

  return NextResponse.json(result, { status: 201 });
}