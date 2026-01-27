import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "@radix-ui/react-label";
import Link from "next/link";

export default async function ClinicCard() {
  const { userId } = await auth();

  if (!userId) return null;

  const clinics = await prisma.clinicUser.findMany({
    where: { userId },
    include: {
      Clinic: true,
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-20 place-items-center">
      {clinics.map((cu) => (
        <Link
         key={`${cu.Clinic.id}`}
          href={`/platform/clinic/${cu.Clinic.id}/dashboard`}
          className="w-full max-w-2xl"
        >
          <Card className="w-full cursor-pointer rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">
                {cu.Clinic.name}
              </CardTitle>
              <CardDescription className="text-base">
                Gestiona las citas y configuración de esta clínica
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground text-sm">
                    Teléfono
                  </Label>
                  <p className="text-lg font-medium">
                    {cu.Clinic.phone}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">
                    Dirección
                  </Label>
                  <p className="text-lg font-medium">
                    {cu.Clinic.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
