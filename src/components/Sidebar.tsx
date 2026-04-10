"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Cpu, Play, Globe, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "AI Models", href: "/models", icon: Cpu },
  { label: "Playground", href: "/playground", icon: Play },
  { label: "Sites", href: "/sites", icon: Globe },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Globe size={16} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900 leading-tight">
          Taedong Translate
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                size={16}
                className={isActive ? "text-blue-600" : "text-gray-400"}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Settings + Footer */}
      <div className="px-3 pb-4 space-y-0.5">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith("/settings")
              ? "bg-blue-50 text-blue-600"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Settings
            size={16}
            className={
              pathname.startsWith("/settings")
                ? "text-blue-600"
                : "text-gray-400"
            }
          />
          Settings
        </Link>
        <div className="pt-4 px-3">
          <span className="text-xs font-semibold tracking-widest text-gray-300 uppercase">
            TEDONG
          </span>
        </div>
      </div>
    </aside>
  );
}
