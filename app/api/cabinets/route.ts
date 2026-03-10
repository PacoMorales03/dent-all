import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

async function verifyClinicMembership(userId: string, clinicId: string) {
  return prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
  });
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");

  if (!clinicId)
    return NextResponse.json(
      { error: "clinicId es obligatorio" },
      { status: 400 }
    );

  // ✅ FIX: Verificar membresía antes de listar gabinetes
  const membership = await verifyClinicMembership(userId, clinicId);
  if (!membership)
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const cabinets = await prisma.cabinets.findMany({
    where: { clinicId },
    orderBy: { num: "asc" },
  });

  return NextResponse.json(cabinets);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { clinicId, description } = await req.json();

  if (!clinicId)
    return NextResponse.json(
      { error: "clinicId es obligatorio" },
      { status: 400 }
    );

  // ✅ FIX: Verificar membresía antes de crear gabinete
  const membership = await verifyClinicMembership(userId, clinicId);
  if (!membership)
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  // ✅ FIX: Race condition — usar MAX(num) en lugar de COUNT para
  // evitar duplicados si dos requests llegan al mismo tiempo.
  // COUNT falla si hay gabinetes eliminados (num 1,2,4 → count=3 → siguiente=4, colisión).
  const maxResult = await prisma.cabinets.aggregate({
    where: { clinicId },
    _max: { num: true },
  });

  const nextNum = (maxResult._max.num ?? 0) + 1;

  const cabinet = await prisma.cabinets.create({
    data: {
      clinicId,
      num: nextNum,
      description,
    },
  });

  return NextResponse.json(cabinet, { status: 201 });
}