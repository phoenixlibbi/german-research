import {
  ClipboardCheck,
  Files,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Timer,
} from "lucide-react";

export const navItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/universities", label: "Universities", icon: GraduationCap },
  { href: "/app/deadlines", label: "Deadlines", icon: Timer },
  { href: "/app/documents", label: "Documents", icon: Files },
  { href: "/app/checklists", label: "Checklists", icon: ClipboardCheck },
  { href: "/app/settings", label: "Settings", icon: Settings },
] as const;

