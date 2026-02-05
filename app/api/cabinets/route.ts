import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");

  if (!clinicId) {
    return new NextResponse("clinicId is required", { status: 400 });
  }

  const cabinets = await prisma.cabinets.findMany({
    where: { clinicId },
    orderBy: { num: "asc" },
  });

  return NextResponse.json(cabinets);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { clinicId, description } = await req.json();

  if (!clinicId) {
    return new NextResponse("clinicId is required", { status: 400 });
  }

  // 🔢 Contar gabinetes existentes en la clínica
  const count = await prisma.cabinets.count({
    where: { clinicId },
  });

  // ➕ El siguiente número
  const nextNum = count + 1;

  const cabinet = await prisma.cabinets.create({
    data: {
      clinicId,
      num: nextNum,
      description,
    },
  });

  return NextResponse.json(cabinet, { status: 201 });
}
