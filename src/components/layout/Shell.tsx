// src/components/layout/Shell.tsx
// WHAT: app frame + the iOS 26 floating tab bar (glass pill, two tabs).
// WHY:  the old Carbon bar was full-bleed, square, and uppercase-tracked — the
//       biggest "not iOS" signal on every screen. Shazam ships a two-tab layout
//       (Library / Shazam) so we keep two tabs, not three.
// A11Y: <nav aria-label>, NavLink adds aria-current="page" automatically, 44pt targets,
//       safe-area inset so the bar clears the home indicator on iPhone.
import { Outlet, NavLink } from "react-router";
import { Mic, User } from "lucide-react";
import { cn } from "../../lib/utils";

const TABS = [
  { to: "/", label: "Shazam", Icon: Mic },
  { to: "/profile", label: "Friends", Icon: User },
];

export function Shell() {
  return (
    <div className="flex flex-col h-full bg-bg text-label overflow-hidden">
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <Outlet />
      </main>

      <nav
        aria-label="Main"
        className="fixed left-0 right-0 z-50 flex justify-center px-6"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="glass flex items-center rounded-full p-1.5 gap-1 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
          {TABS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 h-11 px-5 rounded-full t-subheadline font-semibold transition-colors",
                  isActive ? "bg-tint text-white" : "text-label-secondary hover:text-label"
                )
              }
            >
              <Icon size={20} strokeWidth={2.25} aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
