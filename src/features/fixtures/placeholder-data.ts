/**
 * Synthetic fixtures for UI development only.
 * Not persisted. Not a booking system. Compatible with future PostgreSQL entities.
 */

export type PlaceholderSalon = {
  id: string;
  name: string;
  city: string;
};

export type PlaceholderStaff = {
  id: string;
  displayName: string;
  role: string;
  salonId: string;
  color: string;
};

export type PlaceholderCustomer = {
  id: string;
  displayName: string;
  phone: string;
  lastVisitLabel: string;
};

export type PlaceholderService = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
};

export type PlaceholderAppointment = {
  id: string;
  customerName: string;
  serviceName: string;
  staffId: string;
  startLabel: string;
  endLabel: string;
};

export const placeholderSalons: PlaceholderSalon[] = [
  { id: "salon_jeannie", name: "Jeannie Nagelstudio", city: "Hamburg" },
  { id: "salon_juliet", name: "Juliet – Salon de Beauté", city: "Hamburg" },
  { id: "salon_heide", name: "Heide (geplant)", city: "Heide" },
];

export const placeholderStaff: PlaceholderStaff[] = [
  {
    id: "staff_anna",
    displayName: "Anna M.",
    role: "Nageldesignerin",
    salonId: "salon_jeannie",
    color: "#c9b6a5",
  },
  {
    id: "staff_lena",
    displayName: "Lena K.",
    role: "Nageldesignerin",
    salonId: "salon_jeannie",
    color: "#8fb4a8",
  },
  {
    id: "staff_mira",
    displayName: "Mira S.",
    role: "Empfang",
    salonId: "salon_jeannie",
    color: "#9bb0c7",
  },
  {
    id: "staff_thuy",
    displayName: "Thuy N.",
    role: "Nageldesignerin",
    salonId: "salon_juliet",
    color: "#d4a5b0",
  },
];

export const placeholderCustomers: PlaceholderCustomer[] = [
  {
    id: "cust_001",
    displayName: "Clara Berger",
    phone: "+49 170 0000001",
    lastVisitLabel: "03.11.2026",
  },
  {
    id: "cust_002",
    displayName: "Nora Hartmann",
    phone: "+49 170 0000002",
    lastVisitLabel: "01.11.2026",
  },
  {
    id: "cust_003",
    displayName: "Walk-in Gast",
    phone: "—",
    lastVisitLabel: "Heute",
  },
];

export const placeholderServices: PlaceholderService[] = [
  {
    id: "svc_manicure",
    name: "Maniküre Classic",
    category: "Hände",
    durationMinutes: 45,
    priceCents: 3500,
  },
  {
    id: "svc_gel",
    name: "Gelnägel Neuset",
    category: "Hände",
    durationMinutes: 90,
    priceCents: 6500,
  },
  {
    id: "svc_pedicure",
    name: "Pediküre",
    category: "Füße",
    durationMinutes: 60,
    priceCents: 4500,
  },
];

export const placeholderAppointments: PlaceholderAppointment[] = [
  {
    id: "appt_1",
    customerName: "Clara Berger",
    serviceName: "Gelnägel Neuset",
    staffId: "staff_anna",
    startLabel: "09:00",
    endLabel: "10:30",
  },
  {
    id: "appt_2",
    customerName: "Nora Hartmann",
    serviceName: "Maniküre Classic",
    staffId: "staff_lena",
    startLabel: "10:00",
    endLabel: "10:45",
  },
  {
    id: "appt_3",
    customerName: "Walk-in Gast",
    serviceName: "Pediküre",
    staffId: "staff_anna",
    startLabel: "11:00",
    endLabel: "12:00",
  },
];
