import {
  CalendarDays,
  Megaphone,
  Scissors,
  Settings,
  UserRound,
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
    href: "/mitarbeiter",
    label: "Mitarbeiter",
    icon: UserRound,
    description: "Team und Qualifikationen",
  },
  {
    href: "/leistungen",
    label: "Leistungen",
    icon: Scissors,
    description: "Kategorien und Dauer",
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
