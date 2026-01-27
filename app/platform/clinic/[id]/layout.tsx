import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

function isValidUUID(uuid: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();

  const { id: clinicId } = await params;

  if (!clinicId || !isValidUUID(clinicId)) {
    notFound();
  }

  const clinicUser = await prisma.clinicUser.findUnique({
    where: {
      clinicId_userId: {
        clinicId,
        userId,
      },
    },
    select: {
      clinicId: true,
    },
  });

  if (!clinicUser) {
    notFound();
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger className="fixed top-15" />
        {children}
      </main>
    </SidebarProvider>
  );
}
