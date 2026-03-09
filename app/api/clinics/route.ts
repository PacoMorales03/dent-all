import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const clinicUsers = await prisma.clinicUser.findMany({
      where: { userId },
      include: { Clinic: true },
    });

    const clinics = clinicUsers.map((cu) => ({
      ...cu.Clinic,
      role: cu.role, 
    }));

    return NextResponse.json(clinics);
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const newClinic = await prisma.clinic.create({
      data: { name: name.trim(), phone, address },
    });

    await prisma.clinicUser.create({
      data: { clinicId: newClinic.id, userId, role: 'owner' },
    });

    return NextResponse.json(newClinic, { status: 201 });
  } catch (error) {
    console.error('Error creating clinic:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}