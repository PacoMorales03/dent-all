"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
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

type Props = {
  clinicId: string
  role: "owner" | "admin" | "reception" | "dentist"
}

const NAV_ITEMS = [
  { title: "Dashboard",    path: "dashboard",    icon: Home     },
  { title: "Citas",        path: "appointments", icon: Inbox    },
  { title: "Gabinetes",    path: "cabinets",     icon: Calendar },
  { title: "Buscar",       path: null,           icon: Search   },
  { title: "Ajustes",      path: null,           icon: Settings },
]

export function AppSidebar({ clinicId, role }: Props) {
  const pathname = usePathname()

  return (
    <Sidebar className="pt-15">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const url = item.path
                  ? `/platform/clinic/${clinicId}/${item.path}`
                  : "#"

                const active = item.path ? pathname === url : false

                return (
                  <SidebarMenuItem
                    key={item.title}
                    className={active ? "bg-gray-200" : ""}
                  >
                    <SidebarMenuButton asChild>
                      <Link
                        href={url}
                        className={active ? "font-bold text-blue-600" : ""}
                      >
                        <item.icon />
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