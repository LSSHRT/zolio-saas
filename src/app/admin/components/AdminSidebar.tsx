"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { AdminSectionId, AdminSeverity } from "../types";

export type AdminSidebarSection = {
  id: AdminSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
};

function heroToneClass(tone: AdminSeverity) {
  switch (tone) {
    case "critical":
      return "text-red-300 bg-red-500/15 border-red-400/25";
    case "warning":
      return "text-amber-200 bg-amber-400/15 border-amber-300/25";
    case "success":
      return "text-emerald-200 bg-emerald-500/15 border-emerald-400/25";
    default:
      return "text-slate-200 bg-slate-500/15 border-slate-400/25";
  }
}

type AdminSidebarProps = {
  activeSection: AdminSectionId;
  currentAdmin: {
    name: string;
    email: string;
  };
  heroStatus: {
    label: string;
    description: string;
    tone: AdminSeverity;
  };
  sections: AdminSidebarSection[];
  onSelect: (section: AdminSectionId) => void;
};

export function AdminSidebar({
  activeSection,
  currentAdmin,
  heroStatus,
  sections,
  onSelect,
}: AdminSidebarProps) {
  const initials = currentAdmin.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk.charAt(0).toUpperCase())
    .join("");

  return (
    <aside className="hidden lg:flex lg:w-[296px] lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-white/8 lg:bg-slate-950/55 lg:backdrop-blur-xl">
      <div className="flex-1 p-6">
        <div className="admin-panel-strong rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Zolio</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Ops Cockpit</h1>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-fuchsia-200 ring-1 ring-white/10">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className={`mt-5 rounded-2xl border px-4 py-3 ${heroToneClass(heroStatus.tone)}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{heroStatus.label}</p>
                <p className="mt-1 text-xs text-white/70">{heroStatus.description}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeSection;

            return (
              <button
                key={section.id}
                onClick={() => onSelect(section.id)}
                className={`admin-sidebar-link ${isActive ? "admin-sidebar-link-active" : ""}`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{section.label}</span>
                      {section.badge && (
                        <span className="admin-chip bg-white/8 text-white/80 ring-white/10">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{section.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/8 px-6 py-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white/4 px-4 py-3 ring-1 ring-white/8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/60 to-fuchsia-500/60 text-sm font-semibold text-white">
            {initials || "A"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{currentAdmin.name}</p>
            <p className="truncate text-xs text-slate-400">{currentAdmin.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
