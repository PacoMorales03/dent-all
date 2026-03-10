import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  const { id: clinicId } = await params;

  // ✅ Validación de UUID antes de tocar la BD
  if (!clinicId || !UUID_REGEX.test(clinicId)) notFound();

  const clinicUser = await prisma.clinicUser.findUnique({
    where: { clinicId_userId: { clinicId, userId } },
    select: { clinicId: true, role: true },
  });

  if (!clinicUser) notFound();

  return (
    <SidebarProvider>
  
      <AppSidebar clinicId={clinicId} role={clinicUser.role} />
      <main className="flex-1">
        <SidebarTrigger className="fixed top-15 z-50" />
        {children}
      </main>
    </SidebarProvider>
  );
}