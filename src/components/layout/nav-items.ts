import {
  Bot,
  CalendarDays,
  Globe,
  LifeBuoy,
  Megaphone,
  Plug,
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
    href: "/online",
    label: "Online",
    icon: Globe,
    description: "Buchungslink, Webseite und Profil",
  },
  {
    href: "/einstellungen",
    label: "Einstellungen",
    icon: Settings,
    description: "Salon und Kalender",
  },
  {
    href: "/integrationen",
    label: "Integrationen",
    icon: Plug,
    description: "Kanäle und Anbieter verbinden",
  },
  {
    href: "/ki-rezeption",
    label: "Kundendialog",
    icon: Bot,
    description: "Nachrichten und Freigaben",
  },
  {
    href: "/support",
    label: "Support",
    icon: LifeBuoy,
    description: "Hilfe, Wünsche und Nachrichten",
  },
];
