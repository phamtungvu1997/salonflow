export type CustomerGender = "male" | "female" | "non_binary" | "unknown";

export type CustomerRecord = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  gender: CustomerGender;
  birthDate: string | null;
  phone: string | null;
  phoneLandline: string | null;
  email: string | null;
  postalCode: string | null;
  houseNumber: string | null;
  addressLine: string | null;
  city: string | null;
  formattedAddress: string | null;
  labels: string[];
  additionalInfo: string | null;
  invoiceInfo: string | null;
  appointmentWarning: string | null;
  newsletterOptIn: boolean;
  emailRemindersOptIn: boolean;
  smsRemindersOptIn: boolean;
  birthdayWishesOptIn: boolean;
  feedbackRequestsOptIn: boolean;
  rebookRemindersOptIn: boolean;
  isBlocked: boolean;
  createdAt: string;
  appointmentCount: number;
  cancellationCount: number;
  noShowCount: number;
  totalSpentCents: number;
  lastAppointmentAt: string | null;
  hasFutureAppointment: boolean;
  staffIds: string[];
  serviceNames: string[];
};

export type CustomerAppointmentRecord = {
  id: string;
  status: string;
  source: string;
  notes: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
  services: string;
  staffNames: string;
  totalPriceCents: number;
  totalDurationMinutes: number;
};

export type CustomerHistoryItem = {
  id: string;
  type: "appointment_cancelled" | "appointment_created" | "customer_created";
  title: string;
  subtitle: string | null;
  timestamp: string;
};

export type ActiveCustomerFilter = {
  key: string;
  label: string;
  paramKey: string;
  paramValue: string;
};

export function formatCustomerDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(d)
    .replace(/\./g, "-");
}

export function formatCustomerDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const datePart = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(d)
    .replace(/\./g, "-");
  const timePart = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${datePart} - ${timePart}`;
}

export function formatAppointmentRowDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dayPart = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${dayPart} - ${timePart}`;
}

export type CustomerRow = {
  id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  gender: string;
  birth_date: string | null;
  phone_normalized: string | null;
  phone_landline: string | null;
  email: string | null;
  postal_code: string | null;
  house_number: string | null;
  address_line: string | null;
  city: string | null;
  labels: string[] | null;
  additional_info: string | null;
  invoice_info: string | null;
  appointment_warning: string | null;
  newsletter_opt_in: boolean;
  email_reminders_opt_in: boolean;
  sms_reminders_opt_in: boolean;
  birthday_wishes_opt_in: boolean;
  feedback_requests_opt_in: boolean;
  rebook_reminders_opt_in: boolean;
  is_blocked: boolean;
  created_at: string;
  appointment_count: number;
  cancellation_count: number;
  no_show_count: number;
  total_spent_cents: number;
  last_appointment_at: string | null;
  has_future_appointment: boolean;
  staff_ids: string[] | null;
  service_names: string[] | null;
};

export function mapCustomerRow(customer: CustomerRow): CustomerRecord {
  const parts = customer.display_name.trim().split(/\s+/);
  const firstName = customer.first_name ?? parts[0] ?? "";
  const lastName = customer.last_name ?? parts.slice(1).join(" ");
  const formattedAddress = [
    [customer.address_line, customer.house_number].filter(Boolean).join(" "),
    [customer.postal_code, customer.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: customer.id,
    displayName: customer.display_name,
    firstName,
    lastName,
    gender: (customer.gender || "unknown") as CustomerGender,
    birthDate: customer.birth_date,
    phone: customer.phone_normalized,
    phoneLandline: customer.phone_landline,
    email: customer.email,
    postalCode: customer.postal_code,
    houseNumber: customer.house_number,
    addressLine: customer.address_line,
    city: customer.city,
    formattedAddress: formattedAddress || null,
    labels: customer.labels ?? [],
    additionalInfo: customer.additional_info,
    invoiceInfo: customer.invoice_info,
    appointmentWarning: customer.appointment_warning,
    newsletterOptIn: Boolean(customer.newsletter_opt_in),
    emailRemindersOptIn: Boolean(customer.email_reminders_opt_in ?? true),
    smsRemindersOptIn: Boolean(customer.sms_reminders_opt_in ?? true),
    birthdayWishesOptIn: Boolean(customer.birthday_wishes_opt_in ?? true),
    feedbackRequestsOptIn: Boolean(customer.feedback_requests_opt_in ?? true),
    rebookRemindersOptIn: Boolean(customer.rebook_reminders_opt_in ?? true),
    isBlocked: Boolean(customer.is_blocked),
    createdAt: customer.created_at,
    appointmentCount: Number(customer.appointment_count ?? 0),
    cancellationCount: Number(customer.cancellation_count ?? 0),
    noShowCount: Number(customer.no_show_count ?? 0),
    totalSpentCents: Number(customer.total_spent_cents ?? 0),
    lastAppointmentAt: customer.last_appointment_at,
    hasFutureAppointment: Boolean(customer.has_future_appointment),
    staffIds: (customer.staff_ids ?? []).filter(Boolean),
    serviceNames: (customer.service_names ?? []).filter(Boolean),
  };
}

export function customerInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
