import ClinicCard from "@/components/ClinicCard";
import { CreateClinicButton } from "@/components/CreateClinicButton";
import JoinClinicPopover from "@/components/PopOverJoinClinic";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function PlatformPage() {
  const { userId } = await auth();

  const client = await clerkClient();
  const subscriptionItems = (
    await client.billing.getUserBillingSubscription(userId)
  ).subscriptionItems;

  const planList = (await client.billing.getPlanList()).data;

  const hasRequiredPlan = subscriptionItems.some((sub) => {
    const plan = planList.find((p) => p.id === sub.planId);
    const REQUIRED_PLAN_ID = process.env.NEXT_PUBLIC_REQUIRED_PLAN_ID;
    return plan?.id === REQUIRED_PLAN_ID;
  });

  const clinics = await prisma.clinicUser.findMany({
    where: { userId },
    include: { Clinic: true },
  });

  const clinicsCount = clinics.length;

  if (!hasRequiredPlan && clinicsCount === 0) {
    return <JoinClinicPopover show={true} />;
  }

  if (hasRequiredPlan && clinicsCount === 0) {
    return <CreateClinicButton />;
  }

  if (clinicsCount > 0) {
    return <ClinicCard />;
  }

  return null;
}
