import { prisma } from '@/lib/prisma'
import { auth} from "@clerk/nextjs/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 })
  }

  const body = await request.json()
  const { email } = body

  const existingUser = await prisma.user.findUnique({ where: { id: userId } })
  if (existingUser) {
    return new Response(JSON.stringify({ error: 'Usuario ya existe' }), { status: 409 })
  }

  const newUser = await prisma.user.create({
    data: { id: userId, email }
  })

  return new Response(JSON.stringify(newUser), { status: 201 })
}
