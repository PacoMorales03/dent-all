import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// ============================
// UPDATE
// ============================
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;

    const body = await req.json();
    const {
      patientId,
      dentistId,
      cabinetId,
      description,
      startAt,
      endAt,
    } = body;

    const existing = await prisma.appointments.findUnique({
      where: { id },
    });

    if (!existing) {
      return new NextResponse("La cita no existe", { status: 404 });
    }

    const updated = await prisma.appointments.update({
      where: { id },
      data: {
        patientId,
        dentistId,
        cabinetId,
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("UPDATE ERROR:", error);
    const message = error instanceof Error ? error.message : "Error actualizando la cita";
    return new NextResponse(
      message,
      { status: 500 }
    );
  }
}

// ============================
// DELETE
// ============================
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.appointments.findUnique({
      where: { id },
    });

    if (!existing) {
      return new NextResponse("La cita no existe", { status: 404 });
    }

    await prisma.appointments.delete({
      where: { id },
    });

    return new NextResponse("Cita eliminada correctamente", {
      status: 200,
    });
  } catch (error: unknown) {
    console.error("DELETE ERROR:", error);
    const message = error instanceof Error ? error.message : "Error eliminando la cita";
    return new NextResponse(
      message,
      { status: 500 }
    );
  }
}
