"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Play,
  Globe,
  Settings,
  Globe2,
  FileText,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "AI Models", href: "/models", icon: Cpu },
  { label: "Languages", href: "/languages", icon: Globe2 },
  { label: "Translations", href: "/translations", icon: FileText },
  { label: "Playground", href: "/playground", icon: Play },
  { label: "Sites", href: "/sites", icon: Globe },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Globe size={16} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 leading-tight">
            Taedong Translate
          </span>
        </div>
        {/* Close button — mobile only */}
        <button
          className="md:hidden p-1 text-gray-400 hover:text-gray-600"
          onClick={() => setMobileOpen(false)}
          aria-label="메뉴 닫기"
        >
          <X size={18} />
        </button>
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
    </>
  );

  return (
    <>
      {/* Hamburger button — mobile only, top-left */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:text-gray-900"
        onClick={() => setMobileOpen(true)}
        aria-label="메뉴 열기"
      >
        <Menu size={18} />
      </button>

      {/* Backdrop — mobile only */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed overlay on mobile, relative on desktop */}
      <aside
        ref={sidebarRef}
        className={`
          flex flex-col bg-white border-r border-gray-100
          fixed top-0 left-0 h-full w-60 z-50 transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:h-auto md:min-h-screen md:z-auto md:transition-none
        `}
      >
        {navContent}
      </aside>
    </>
  );
}
