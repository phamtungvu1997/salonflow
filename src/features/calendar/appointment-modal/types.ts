export type ShiftWindow = { isoWeekday: number; startMinute: number; endMinute: number };

export type ModalStaff = {
  id: string;
  displayName: string;
  color: string;
  shifts: ShiftWindow[];
};

export type ModalService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  staffIds: string[];
};

export type ModalCustomer = {
  id: string;
  displayName: string;
  phone?: string | null;
  email?: string | null;
};

export type BusyRange = { staffId: string; startMinute: number; endMinute: number };
