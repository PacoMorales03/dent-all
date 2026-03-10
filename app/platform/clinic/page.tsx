import ClinicCard from "@/components/ClinicCard";
import { CreateClinicButton } from "@/components/CreateClinicButton";
import JoinClinicPopover from "@/components/PopOverJoinClinic";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function PlatformPage() {
  const { userId } = await auth();

  // ✅ FIX: La llamada a la API de billing puede fallar si el plan no está
  // configurado o si Clerk Billing no está habilitado en el entorno.
  // Se envuelve en try/catch para que la página no rompa en desarrollo
  // o en entornos sin billing configurado.
  let hasRequiredPlan = false;

  try {
    const client = await clerkClient();
    const subscriptionItems = (
      await client.billing.getUserBillingSubscription(userId)
    ).subscriptionItems;

    const planList = (await client.billing.getPlanList()).data;
    const REQUIRED_PLAN_ID = process.env.NEXT_PUBLIC_REQUIRED_PLAN_ID;

    hasRequiredPlan = subscriptionItems.some((sub) =>
      planList.find((p) => p.id === sub.planId)?.id === REQUIRED_PLAN_ID
    );
  } catch {
    // Billing no configurado o plan no encontrado → tratar como sin plan
    hasRequiredPlan = false;
  }

  const clinics = await prisma.clinicUser.findMany({
    where: { userId },
    include: { Clinic: true },
  });

  const clinicsCount = clinics.length;

  if (clinicsCount > 0) return <ClinicCard />;
  if (hasRequiredPlan) return <CreateClinicButton />;
  return <JoinClinicPopover show={true} />;
}