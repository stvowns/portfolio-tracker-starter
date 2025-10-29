"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  IconCoin,
  IconChartBar,
  IconDashboard,
  IconFileAi,
  IconSettings,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { MiniPriceMonitor } from "@/components/mini-price-monitor"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const staticData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Performans",
      url: "/performance",
      icon: IconChartBar,
    },
    {
      title: "Altın Fiyatları",
      url: "/debug/gold-prices",
      icon: IconCoin,
    },
    {
      title: "AI Assistant",
      url: "/chat",
      icon: IconFileAi,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Mock user data - auth sistemi kullanılmıyor
  const userData = {
    name: "Guest User",
    email: "guest@example.com",
    avatar: "/codeguide-logo.png",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image 
                  src="/codeguide-logo.png" 
                  alt="CodeGuide" 
                  width={32} 
                  height={32} 
                  className="rounded-lg"
                  suppressHydrationWarning 
                />
                <span className="text-base font-semibold font-parkinsans">CodeGuide</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={staticData.navMain} />
        <MiniPriceMonitor />
        <NavSecondary items={staticData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
