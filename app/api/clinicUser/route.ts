import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clinicUsers = await prisma.clinicUser.findMany({
      where: {
        userId,
      },
      include: {
        Clinic: true,
      },
    });

    return NextResponse.json(clinicUsers);
  } catch (error) {
    console.error("Error fetching clinic users:", error);
    return new NextResponse("Error fetching clinic users", { status: 500 });
  }
}
