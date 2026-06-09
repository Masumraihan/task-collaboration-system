"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Bell,
  Activity,
  User,
  Zap,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    label: "Members",
    href: "/dashboard/members",
    icon: Users,
    roles: ["ADMIN", "PROJECT_MANAGER"],
  },
  {
    label: "Activity",
    href: "/dashboard/activity",
    icon: Activity,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: User,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role || "TEAM_MEMBER";

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className='w-64 border-r bg-card flex flex-col shrink-0 hidden md:flex'>
      {/* Logo */}
      <div className='h-16 flex items-center px-6 border-b'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-lg bg-primary flex items-center justify-center'>
            <Zap className='w-4 h-4 text-primary-foreground' />
          </div>
          <span className='font-bold text-lg tracking-tight'>TaskFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className='flex-1 px-3 py-4 space-y-1'>
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <item.icon className='w-4 h-4 shrink-0' />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User role badge */}
      <div className='p-4 border-t'>
        <div className='px-3 py-2 rounded-md bg-muted'>
          <p className='text-xs text-muted-foreground'>Signed in as</p>
          <p className='text-sm font-medium truncate'>{user?.name || "User"}</p>
          <span className='text-xs text-primary font-medium'>{role.replace("_", " ")}</span>
        </div>
      </div>
    </aside>
  );
}
