"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  ClipboardCheck,
  Users,
  BookOpen,
  Image,
  Settings,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/signoff", label: "Project Sign-Off", icon: ClipboardCheck },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/rates", label: "Rates Library", icon: BookOpen },
  { href: "/visuals", label: "Visuals", icon: Image },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-navy-900 text-white flex flex-col">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">WV Construction</p>
          <p className="text-[10px] text-navy-300 leading-tight">Business Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                isActive
                  ? "bg-amber-500 text-white"
                  : "text-navy-200 hover:bg-navy-800 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-white" : "text-navy-400 group-hover:text-white")} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-navy-700">
        <p className="text-[10px] text-navy-400 leading-tight">
          ACOR Building and Property Solutions Ltd
        </p>
        <p className="text-[10px] text-navy-500">t/a WV Construction · Reg. 9287377</p>
      </div>
    </aside>
  );
}
