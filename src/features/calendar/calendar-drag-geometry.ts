export type DragColumnRect = {
  staffId: string;
  displayName: string;
  color: string;
  left: number;
  right: number;
};

export type DragGridMetrics = {
  /** Top of the first time-slot row (08:00) in viewport coordinates, accounting for sticky headers and scroll */
  firstSlotTopViewportY: number;
  /** Left bound of the scrollable grid body in viewport coordinates */
  gridLeftViewportX: number;
  /** Right bound of the scrollable grid body in viewport coordinates */
  gridRightViewportX: number;
  /** Top bound of the scrollable grid body (below sticky headers) in viewport coordinates */
  gridTopViewportY: number;
  /** Bottom bound of the scrollable grid body in viewport coordinates */
  gridBottomViewportY: number;
  /** Height in pixels of one slot increment (default 28px per 15-min row) */
  slotRowHeightPx: number;
  /** Minutes per slot row (default 15) */
  slotIntervalMinutes: number;
  /** Start hour of the calendar grid (default 8 = 08:00) */
  startHour: number;
  /** End hour of the calendar grid (default 21 = 21:00) */
  endHour: number;
  /** Visible employee column bounding boxes in viewport coordinates */
  columns: DragColumnRect[];
};

export type DragTargetProposal = {
  staffId: string;
  staffDisplayName: string;
  staffColor: string;
  startMinute: number;
  endMinute: number;
  /** Top offset in pixels relative to the first slot row (08:00) */
  snappedOffsetTopPx: number;
  /** Column left in viewport coordinates */
  columnLeftPx: number;
  /** Column width in pixels */
  columnWidthPx: number;
};

export const DRAG_ACTIVATION_THRESHOLD_PX = 6;

/**
 * Returns true once the pointer has moved at least `thresholdPx` Euclidean distance from pointerdown.
 */
export function hasExceededDragThreshold(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  thresholdPx = DRAG_ACTIVATION_THRESHOLD_PX,
): boolean {
  const dx = currentX - startX;
  const dy = currentY - startY;
  return Math.hypot(dx, dy) >= thresholdPx;
}

/**
 * Pure coordinate-to-slot calculation for the Day Calendar grid.
 * Converts the pointer position + grab offset into a snapped start/end minute and target employee ID.
 */
export function resolveCalendarDropTarget(
  pointerClientX: number,
  pointerClientY: number,
  grabOffsetY: number,
  durationMinutes: number,
  metrics: DragGridMetrics,
): DragTargetProposal | null {
  // Reject drops completely outside the calendar grid horizontal bounds (with small 24px tolerance)
  if (
    pointerClientX < metrics.gridLeftViewportX - 24 ||
    pointerClientX > metrics.gridRightViewportX + 24 ||
    pointerClientY < metrics.gridTopViewportY - 32 ||
    pointerClientY > metrics.gridBottomViewportY + 32
  ) {
    return null;
  }

  // Find target employee column by stable staffId bounding box
  const matchedColumn = metrics.columns.find(
    (col) => pointerClientX >= col.left && pointerClientX <= col.right,
  );
  if (!matchedColumn) {
    return null;
  }

  const cardTopViewportY = pointerClientY - grabOffsetY;
  const offsetFromFirstSlotPx = cardTopViewportY - metrics.firstSlotTopViewportY;
  const rawSlotIndex = Math.round(offsetFromFirstSlotPx / metrics.slotRowHeightPx);

  const minMinute = metrics.startHour * 60;
  const maxEndMinute = metrics.endHour * 60;
  const safeDuration = Math.max(metrics.slotIntervalMinutes, durationMinutes);
  const maxStartMinute = Math.max(minMinute, maxEndMinute - safeDuration);

  const unclampedStartMinute = minMinute + rawSlotIndex * metrics.slotIntervalMinutes;
  const snappedStartMinute = Math.max(
    minMinute,
    Math.min(maxStartMinute, unclampedStartMinute),
  );
  const snappedEndMinute = snappedStartMinute + safeDuration;
  const snappedSlotIndex =
    (snappedStartMinute - minMinute) / metrics.slotIntervalMinutes;

  return {
    staffId: matchedColumn.staffId,
    staffDisplayName: matchedColumn.displayName,
    staffColor: matchedColumn.color,
    startMinute: snappedStartMinute,
    endMinute: snappedEndMinute,
    snappedOffsetTopPx: snappedSlotIndex * metrics.slotRowHeightPx,
    columnLeftPx: matchedColumn.left,
    columnWidthPx: Math.max(60, matchedColumn.right - matchedColumn.left),
  };
}

export type DropAvailabilityClassification =
  | { kind: "available" }
  | { kind: "soft_unavailable"; reason: string }
  | { kind: "hard_conflict"; reason: string };

/**
 * Classifies a proposed drop target on the client before calling the Booking Engine API:
 * - Hard conflicts (occupied appointment overlap or ineligible service/staff pairing) cannot be overridden.
 * - Soft unavailability (outside employee working shift or overlapping an employee absence) triggers the
 *   confirmation modal ("Diese Zeit ist nicht verfügbar, möchtest du wirklich speichern?") matching the video.
 */
export function classifyDropAvailability(params: {
  appointmentId: string;
  serviceName: string;
  targetStaffId: string;
  targetStaffName: string;
  targetStartMinute: number;
  targetEndMinute: number;
  isoWeekday: number;
  shifts: { isoWeekday: number; startMinute: number; endMinute: number }[];
  absences: { staffId: string; startMinute: number; endMinute: number; reason: string }[];
  appointments: {
    id: string;
    staffId: string;
    startMinute: number;
    endMinute: number;
    status?: string;
  }[];
  services: { id: string; name: string; staffIds: string[] }[];
}): DropAvailabilityClassification {
  const {
    appointmentId,
    serviceName,
    targetStaffId,
    targetStaffName,
    targetStartMinute,
    targetEndMinute,
    isoWeekday,
    shifts,
    absences,
    appointments,
    services,
  } = params;

  // 1. Check hard service/employee eligibility
  const matchedService = services.find((s) => s.name === serviceName);
  if (
    matchedService &&
    matchedService.staffIds.length > 0 &&
    !matchedService.staffIds.includes(targetStaffId)
  ) {
    return {
      kind: "hard_conflict",
      reason: `Leistung „${serviceName}“ ist für ${targetStaffName} nicht buchbar.`,
    };
  }

  // 2. Check hard overlap with another active appointment (including no_show which retains allocation)
  const overlappingAppointment = appointments.find(
    (item) =>
      item.id !== appointmentId &&
      item.staffId === targetStaffId &&
      item.status !== "cancelled" &&
      item.startMinute < targetEndMinute &&
      item.endMinute > targetStartMinute,
  );
  if (overlappingAppointment) {
    return {
      kind: "hard_conflict",
      reason: "Die neue Zeit ist bereits belegt.",
    };
  }

  // 3. Check soft unavailability: employee absence or outside working hours
  const overlappingAbsence = absences.find(
    (abs) =>
      abs.staffId === targetStaffId &&
      abs.startMinute < targetEndMinute &&
      abs.endMinute > targetStartMinute,
  );
  if (overlappingAbsence) {
    return {
      kind: "soft_unavailable",
      reason: `${targetStaffName.split(" ")[0]} ist nicht verfügbar (${overlappingAbsence.reason})`,
    };
  }

  const dayShifts = shifts.filter((s) => s.isoWeekday === isoWeekday);
  const withinShift = dayShifts.some(
    (s) => targetStartMinute >= s.startMinute && targetEndMinute <= s.endMinute,
  );
  if (!withinShift) {
    return {
      kind: "soft_unavailable",
      reason: `${targetStaffName.split(" ")[0]} ist nicht verfügbar`,
    };
  }

  return { kind: "available" };
}
