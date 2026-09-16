import { Outlet, NavLink } from "react-router";
import { Microphone, User } from "@carbon/icons-react";
import { cn } from "../../lib/utils";

export function Shell() {
  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-14 relative">
        <Outlet />
      </main>

      {/* Bottom Navigation - Carbon Style */}
      <nav className="fixed bottom-0 w-full bg-[#262626] border-t border-[#393939] z-50">
        <div className="flex justify-around items-center h-14 max-w-md mx-auto">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200 border-t-2",
                isActive ? "text-[#0f62fe] border-[#0f62fe] bg-[#393939]" : "text-[#c6c6c6] border-transparent hover:bg-[#393939] hover:text-[#f4f4f4]"
              )
            }
          >
            <Microphone size={20} />
            <span className="text-[10px] uppercase tracking-widest mt-0.5">Discover</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200 border-t-2",
                isActive ? "text-[#0f62fe] border-[#0f62fe] bg-[#393939]" : "text-[#c6c6c6] border-transparent hover:bg-[#393939] hover:text-[#f4f4f4]"
              )
            }
          >
            <User size={20} />
            <span className="text-[10px] uppercase tracking-widest mt-0.5">Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
