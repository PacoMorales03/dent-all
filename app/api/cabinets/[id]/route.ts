import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// GET - Obtener un gabinete específico
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { id } = await params;

    const cabinet = await prisma.cabinets.findUnique({
      where: { id },
    });

    if (!cabinet) {
      return new NextResponse("Cabinet not found", { status: 404 });
    }

    return NextResponse.json(cabinet);
  } catch (error) {
    console.error("Error fetching cabinet:", error);
    return new NextResponse("Error fetching cabinet", { status: 500 });
  }
}

// PATCH - Actualizar un gabinete específico
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { id } = await params; 
    const { description } = await req.json();

    // Verificar que el gabinete existe
    const existingCabinet = await prisma.cabinets.findUnique({
      where: { id },
    });

    if (!existingCabinet) {
      return new NextResponse("Cabinet not found", { status: 404 });
    }

    // Actualizar el gabinete
    const updatedCabinet = await prisma.cabinets.update({
      where: { id },
      data: { 
        description: description === null ? null : description 
      },
    });

    return NextResponse.json(updatedCabinet);
  } catch (error) {
    console.error("Error updating cabinet:", error);
    return new NextResponse("Error updating cabinet", { status: 500 });
  }
}

// DELETE - Eliminar un gabinete específico
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { id } = await params; 

    // Verificar que el gabinete existe
    const existingCabinet = await prisma.cabinets.findUnique({
      where: { id },
    });

    if (!existingCabinet) {
      return new NextResponse("Cabinet not found", { status: 404 });
    }

    // Eliminar el gabinete
    await prisma.cabinets.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting cabinet:", error);
    return new NextResponse("Error deleting cabinet", { status: 500 });
  }
}