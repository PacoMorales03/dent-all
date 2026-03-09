"use client"

import { usePathname } from "next/navigation"
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    urlTemplate: "/platform/clinic/[id]/dashboard",
    icon: Home,
  },
  {
    title: "Appointments",
    urlTemplate: "/platform/clinic/[id]/appointments",
    icon: Inbox,
  },
  {
    title: "Cabinets",
    urlTemplate: "/platform/clinic/[id]/cabinets",
    icon: Calendar,
  },
  {
    title: "Search",
    urlTemplate: "#",
    icon: Search,
  },
  {
    title: "Settings",
    urlTemplate: "#",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  // Extraemos clinicId de la URL actual
  // Asumimos que la ruta es algo como /platform/clinic/{clinicId}/dashboard
  const parts = pathname.split("/")
  const clinicId = parts[3] || ""

  // Función para reemplazar [id] por el clinicId real
  const buildUrl = (urlTemplate: string) =>
    urlTemplate.includes("[id]") ? urlTemplate.replace("[id]", clinicId) : urlTemplate

  // Detectar si el item está activo comparando la URL construida con la ruta actual
  const isActive = (urlTemplate: string) => {
    const url = buildUrl(urlTemplate)
    return pathname === url
  }

  return (
    <Sidebar className="pt-15">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const url = buildUrl(item.urlTemplate)
                const active = isActive(item.urlTemplate)

                return (
                  <SidebarMenuItem key={item.title} className={active ? "bg-gray-200" : ""}>
                    <SidebarMenuButton asChild>
                      <a href={url} className={active ? "font-bold text-blue-600" : ""}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
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
