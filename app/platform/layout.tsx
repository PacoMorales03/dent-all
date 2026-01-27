// app/platform/layout.tsx
import { ReactNode } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma'

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if(!existingUser){
      await prisma.user.create({data:{id: userId, email}})
    }
  }

  return <div>{children}</div>;
}
