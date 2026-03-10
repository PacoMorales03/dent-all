import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

async function verifyDentistAccess(userId: string, dentistId: string) {
  const relation = await prisma.clinicDentists.findFirst({
    where: {
      DentistId: dentistId,
      Clinic: { ClinicUser: { some: { userId, role: { in: ["owner", "admin"] } } } },
    },
    select: { ClinicId: true },
  });
  return relation;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const access = await verifyDentistAccess(userId, id);
  if (!access) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = await req.json();
  const { name, surname, phone, specialty } = body;

  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const updated = await prisma.dentist.update({
    where: { id },
    data: { name: name.trim(), surname: surname ?? null, phone: phone ?? null, specialty: specialty ?? null },
    select: { id: true, name: true, surname: true, phone: true, specialty: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const access = await verifyDentistAccess(userId, id);
  if (!access) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  // Remove clinic associations first, then delete dentist
  await prisma.clinicDentists.deleteMany({ where: { DentistId: id } });
  await prisma.dentist.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}