import { NavLink } from "react-router-dom";
import {
  IconLayoutDashboard,
  IconFolder,
  IconMessageCircle,
  IconScan,
  IconBulb,
  IconChecklist,
  IconBell,
  IconSettings,
  IconRadar,
  IconHelp,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { startWalkthrough } from "@/lib/walkthrough";

const navigation = [
  { name: "Dashboard", href: "/", icon: IconLayoutDashboard },
  { name: "Projects", href: "/projects", icon: IconFolder },
  { name: "Prompts", href: "/prompts", icon: IconMessageCircle },
  { name: "Scans", href: "/scans", icon: IconScan },
  { name: "Insights", href: "/insights", icon: IconBulb },
  { name: "Actions", href: "/actions", icon: IconChecklist },
  { name: "Alerts", href: "/alerts", icon: IconBell },
];

export function Sidebar() {
  return (
    <div className="fixed inset-y-0 left-0 z-[100] flex w-56 flex-col bg-card border-r border-border">
      <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
        <IconRadar className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">GEOPulse</span>
      </div>

      <nav id="sidebar-nav" className="flex-1 space-y-1 p-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/"}
            id={`nav-${item.name.toLowerCase()}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div id="sidebar-footer" className="border-t border-border p-2">
        <div className="flex items-center justify-between">
          <NavLink
            id="nav-settings"
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors flex-1",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <IconSettings className="h-5 w-5" />
            Settings
          </NavLink>
          <button
            id="help-button"
            onClick={() => startWalkthrough()}
            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="App walkthrough"
          >
            <IconHelp className="h-4 w-4" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
