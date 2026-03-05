'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  FileDigit,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/firebase';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();

  const handleLogout = () => {
    auth.signOut();
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <FileDigit className="text-primary size-8" />
          <span className="text-xl font-semibold">FatturaNow</span>
        </div>
      </SidebarHeader>
      <SidebarMenu>
        {menuItems.map(({ href, label, icon: Icon }) => (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(href)}
              tooltip={label}
            >
              <Link href={href}>
                <Icon />
                <span>{label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
