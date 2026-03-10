import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

async function verifyMembership(userId: string, clinicId: string) {
  return prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
    select: { role: true },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const cabinet = await prisma.cabinets.findUnique({ where: { id } });
  if (!cabinet) return NextResponse.json({ error: "Gabinete no encontrado" }, { status: 404 });

  const membership = await verifyMembership(userId, cabinet.clinicId);
  if (!membership) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  return NextResponse.json(cabinet);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;


  const cabinet = await prisma.cabinets.findUnique({ where: { id } });
  if (!cabinet) return NextResponse.json({ error: "Gabinete no encontrado" }, { status: 404 });

  const membership = await verifyMembership(userId, cabinet.clinicId);
  if (!membership) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });


  const { description } = await req.json();

  const updated = await prisma.cabinets.update({
    where: { id },
    data: { description: description === null ? null : description },
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

  const cabinet = await prisma.cabinets.findUnique({ where: { id } });
  if (!cabinet) return NextResponse.json({ error: "Gabinete no encontrado" }, { status: 404 });

  const membership = await verifyMembership(userId, cabinet.clinicId);
  if (!membership) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const activeCitas = await prisma.appointments.count({
    where: {
      cabinetId: id,
      status: { in: ["scheduled"] },
    },
  });

  if (activeCitas > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: el gabinete tiene ${activeCitas} cita(s) programada(s)` },
      { status: 409 }
    );
  }

  await prisma.cabinets.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}