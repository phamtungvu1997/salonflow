export type SettingsSectionId =
  | "hub"
  | "general"
  | "export"
  | "users"
  | "integrations"
  | "company"
  | "absences"
  | "employees"
  | "resources"
  | "timetable"
  | "calendar"
  | "services"
  | "online-bookings"
  | "customer-settings"
  | "forms"
  | "invoices"
  | "vat"
  | "loyalty"
  | "feedback-widget"
  | "pricing-widget";

export interface SalonSettingsRecord {
  salonId: string;
  language: string;
  currency: string;
  timeZone: string;
  weekStart: "monday" | "sunday";
  timeFormat: "24h" | "12h";
  ipRestrictionEnabled: boolean;
  ipWhitelist: string;
  postalCode: string;
  houseNumber: string;
  addressLine: string;
  city: string;
  phone: string;
  notificationEmail: string;
  billingEmail: string;
  smsSender: string;
  smsNotificationPhone: string;
  facebookHandle: string;
  instagramHandle: string;
  slotIntervalMinutes: number;
  appointmentColorMode: "category" | "employee";
  hideUnscheduledStaff: boolean;
  endBufferEnabled: boolean;
  allowOnlineCancel: boolean;
  onlineCancelLeadHours: number;
  allowOnlineReschedule: boolean;
  onlineRescheduleLeadHours: number;
  noShowEmailPrompt: boolean;
  emailReminderEnabled: boolean;
  emailReminderLeadHours: number;
  customerLabels: string[];
  customFields: string[];
  onlineBookingEnabled: boolean;
  onlineAllowStaffChoice: boolean;
  onlineShowPrice: boolean;
  onlineShowDuration: boolean;
  onlineIntervalMinutes: number;
  onlineAdvanceMonths: number;
  onlineWidgetColor: string;
}

export interface SettingsStats {
  totalCustomers: number;
  totalAppointments: number;
  activeStaff: number;
  activeServices: number;
}

export interface UserAccountRow {
  id: string;
  email: string;
  displayName: string;
  status: string;
  role: "owner" | "manager" | "receptionist" | "technician";
}

export interface ActivityLogRow {
  id: string;
  action: string;
  createdAt: string;
  userName: string;
  customerName: string;
}

export interface ResourceRow {
  id: string;
  resourceType: string;
  staffId: string | null;
  displayName: string;
  active: boolean;
}

export interface StaffShift {
  isoWeekday: number;
  startMinute: number;
  endMinute: number;
}

export interface StaffMemberRecord {
  id: string;
  displayName: string;
  color: string;
  email: string;
  phone: string;
  gender: "female" | "male" | "unknown";
  bookableOnline: boolean;
  sortOrder: number;
  active: boolean;
  serviceIds: string[];
  serviceCount: number;
  shifts: StaffShift[];
}

export interface ServiceCategoryRecord {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface ServiceRecord {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  durationMinutes: number;
  priceCents: number;
  staffIds: string[];
}

export interface NationalHolidayRow {
  id: string;
  description: string;
  date: string;
}

export interface AbsenceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffColor: string | null;
  startsAt: string;
  endsAt: string;
  description: string;
}

export const SETTINGS_COLOR_SWATCHES = [
  "#f9a8d4",
  "#f4b6c2",
  "#f6c9d0",
  "#f7c59f",
  "#fdba74",
  "#f6d7a8",
  "#86efac",
  "#b7d7c9",
  "#8fb4a8",
  "#93c5fd",
  "#c5d4f0",
  "#c4b5fd",
  "#d7c4f2",
  "#dec9f2",
];

export interface SettingsNavGroup {
  groupLabel: string;
  items: {
    id: SettingsSectionId;
    label: string;
    deferredV1?: boolean;
  }[];
}

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    groupLabel: "ALLGEMEIN",
    items: [
      { id: "general", label: "Allgemeine Einstellungen" },
      { id: "export", label: "Datenexport" },
      { id: "users", label: "Benutzerkonten" },
      { id: "integrations", label: "Integrationen", deferredV1: true },
    ],
  },
  {
    groupLabel: "UNTERNEHMEN",
    items: [
      { id: "company", label: "Unternehmensdaten" },
      { id: "absences", label: "Abwesenheiten" },
      { id: "employees", label: "Mitarbeiter" },
      { id: "resources", label: "Ressourcen" },
      { id: "timetable", label: "Arbeitszeiten" },
    ],
  },
  {
    groupLabel: "KALENDER",
    items: [
      { id: "calendar", label: "Kalendereinstellungen" },
      { id: "services", label: "Leistungen" },
      { id: "online-bookings", label: "Online-Buchungen" },
    ],
  },
  {
    groupLabel: "KUNDEN",
    items: [
      { id: "customer-settings", label: "Kundeneinstellungen" },
      { id: "forms", label: "Formulare", deferredV1: true },
    ],
  },
  {
    groupLabel: "VERKÄUFE",
    items: [
      { id: "invoices", label: "Rechnungen & Belege", deferredV1: true },
      { id: "vat", label: "MwSt.-Sätze", deferredV1: true },
      { id: "loyalty", label: "Treuepunkte", deferredV1: true },
    ],
  },
  {
    groupLabel: "PROMOTION",
    items: [
      { id: "feedback-widget", label: "Bewertungs-Widget", deferredV1: true },
      { id: "pricing-widget", label: "Preislisten-Widget", deferredV1: true },
    ],
  },
];

export function formatMinutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatEuroPrice(priceCents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}
