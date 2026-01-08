import {
  CalendarDays,
  ClipboardCheck,
  Files,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  Shield,
  Target,
  Settings,
  Timer,
} from "lucide-react";

export const navItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/universities", label: "Universities", icon: GraduationCap },
  { href: "/app/deadlines", label: "Deadlines", icon: Timer },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/documents", label: "Documents", icon: Files },
  { href: "/app/checklists", label: "Checklists", icon: ClipboardCheck },
  { href: "/app/targets", label: "Targets", icon: Target },
  { href: "/app/notes", label: "Notes", icon: NotebookPen },
  { href: "/app/admin", label: "Admin", icon: Shield },
  { href: "/app/settings", label: "Settings", icon: Settings },
] as const;

