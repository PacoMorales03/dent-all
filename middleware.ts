import { clerkMiddleware, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const isProtected = pathname.startsWith("/platform");

  // Rutas públicas que no requieren autenticación
  const publicPaths = ["/login", "/register", "/_next", "/favicon.ico"];
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Obtener sesión autenticada
  const session = await auth();
  const userId = session.userId;

  // Si no hay usuario, redirigir a /login
  if (!userId && isProtected) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Protección estricta para /api
  if (pathname.startsWith("/api")) {
    if (!userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const client = await clerkClient();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
