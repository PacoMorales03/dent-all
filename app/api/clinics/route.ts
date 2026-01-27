import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const clinics = await prisma.clinic.findMany({
      include: {
        ClinicUser: true,  // si quieres info de usuarios relacionados
      },
    });
    return NextResponse.json(clinics);
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return new NextResponse('Error fetching clinics', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Autenticación Clerk para obtener userId del usuario logueado
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address } = body;

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    // Crear clínica
    const newClinic = await prisma.clinic.create({
      data: {
        name,
        phone,
        address,
      },
    });

    // Crear relación ClinicUser con rol owner para el creador
    await prisma.clinicUser.create({
      data: {
        clinicId: newClinic.id,
        userId: userId,
        role: 'owner',
      },
    });

    return NextResponse.json(newClinic, { status: 201 });
  } catch (error) {
    console.error('Error creating clinic:', error);
    return new NextResponse('Error creating clinic', { status: 500 });
  }
}
