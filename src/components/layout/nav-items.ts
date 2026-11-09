import {
  CalendarDays,
  Megaphone,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const primaryNav: NavItem[] = [
  {
    href: "/kalender",
    label: "Kalender",
    icon: CalendarDays,
    description: "Tages- und Wochenansicht",
  },
  {
    href: "/kunden",
    label: "Kunden",
    icon: Users,
    description: "Kundensuche und Profile",
  },
  {
    href: "/marketing",
    label: "Marketing",
    icon: Megaphone,
    description: "Einblicke, Warteliste und Rabatte",
  },
  {
    href: "/einstellungen",
    label: "Einstellungen",
    icon: Settings,
    description: "Salon und Kalender",
  },
];
