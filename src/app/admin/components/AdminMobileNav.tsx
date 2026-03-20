"use client";

import type { AdminSectionId } from "../types";
import type { AdminSidebarSection } from "./AdminSidebar";

type AdminMobileNavProps = {
  activeSection: AdminSectionId;
  onSelect: (section: AdminSectionId) => void;
  sections: AdminSidebarSection[];
};

export function AdminMobileNav({
  activeSection,
  onSelect,
  sections,
}: AdminMobileNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/88 px-3 pb-[calc(env(safe-area-inset-bottom)+0.7rem)] pt-2.5 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeSection;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={`relative flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-[20px] border px-2 py-2 text-center transition ${
                isActive
                  ? "border-violet-300/24 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-transparent text-white shadow-[0_18px_30px_-24px_rgba(124,58,237,0.65)]"
                  : "border-white/8 bg-white/[0.045] text-slate-300"
              }`}
              aria-pressed={isActive}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="text-[10px] font-medium leading-tight">{section.label}</span>
              {section.badge && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-fuchsia-300" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
