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
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  durationMinutes: number;
  priceCents: number;
  active?: boolean;
  staffIds: string[];
};

export type ModalCustomer = {
  id: string;
  displayName: string;
  phone?: string | null;
  email?: string | null;
};

export type BusyRange = { staffId: string; startMinute: number; endMinute: number };
