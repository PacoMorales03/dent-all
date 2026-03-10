"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  Users,
  Stethoscope,
  Settings,
  UserCog,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type Props = {
  clinicId: string
  role: "owner" | "admin" | "reception" | "dentist"
}

const NAV_ITEMS = [
  { title: "Dashboard",    path: "dashboard",    icon: LayoutDashboard },
  { title: "Citas",        path: "appointments", icon: CalendarDays    },
  { title: "Pacientes",    path: "patients",     icon: Users           },
  { title: "Dentistas",    path: "dentists",     icon: Stethoscope     },
  { title: "Gabinetes",    path: "cabinets",     icon: DoorOpen        },
]

const ADMIN_ITEMS = [
  { title: "Trabajadores", path: "workers",      icon: UserCog,        roles: ["owner", "admin"] as const },
]

const SETTINGS_ITEMS = [
  { title: "Ajustes",      path: "settings",     icon: Settings        },
]

export function AppSidebar({ clinicId, role }: Props) {
  const pathname = usePathname()

  const buildUrl = (path: string) => `/platform/clinic/${clinicId}/${path}`

  const linkClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
      active
        ? "font-semibold text-blue-600 dark:text-blue-400"
        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
    }`

  return (
    <Sidebar className="pt-15">
      <SidebarContent>
        {/* ── Gestión ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-zinc-400 uppercase tracking-wider px-2 mb-1">
            Gestión
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const url = buildUrl(item.path)
                const active = pathname === url
                return (
                  <SidebarMenuItem
                    key={item.title}
                    className={active ? "bg-zinc-100 dark:bg-zinc-800 rounded-lg" : ""}
                  >
                    <SidebarMenuButton asChild>
                      <Link href={url} className={linkClass(active)}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Equipo (solo owner/admin) ── */}
        {["owner", "admin"].includes(role) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-zinc-400 uppercase tracking-wider px-2 mb-1">
              Equipo
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_ITEMS.filter((item) => item.roles.includes(role as "owner" | "admin")).map((item) => {
                  const url = buildUrl(item.path)
                  const active = pathname === url
                  return (
                    <SidebarMenuItem
                      key={item.title}
                      className={active ? "bg-zinc-100 dark:bg-zinc-800 rounded-lg" : ""}
                    >
                      <SidebarMenuButton asChild>
                        <Link href={url} className={linkClass(active)}>
                          <item.icon className="w-4 h-4 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ── Clínica ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-zinc-400 uppercase tracking-wider px-2 mb-1">
            Clínica
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SETTINGS_ITEMS.map((item) => {
                const url = buildUrl(item.path)
                const active = pathname === url
                return (
                  <SidebarMenuItem
                    key={item.title}
                    className={active ? "bg-zinc-100 dark:bg-zinc-800 rounded-lg" : ""}
                  >
                    <SidebarMenuButton asChild>
                      <Link href={url} className={linkClass(active)}>
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}