import { format, parseISO } from 'date-fns';

export type WorkingHourDraft = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  closed: boolean;
};

export type BlackoutDateDraft = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
};

export type DateRangeDto = {
  startDate: string;
  endDate: string;
  reason?: string;
};

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDateInput(value?: string, fallback = ''): string {
  if (!value) {
    return fallback;
  }

  try {
    return format(parseISO(value), 'yyyy-MM-dd');
  } catch {
    return fallback;
  }
}

export function getWeekdayLabel(dayOfWeek: number): string {
  return weekdayLabels[dayOfWeek] ?? `Day ${dayOfWeek}`;
}

export function createBusinessWorkingHourDrafts(
  hours?: Array<{ dayOfWeek: number; startTime: string; endTime: string; closed?: boolean }>,
): WorkingHourDraft[] {
  return weekdayLabels.map((_, dayOfWeek) => {
    const existingHour = hours?.find((hour) => hour.dayOfWeek === dayOfWeek);

    return {
      dayOfWeek,
      startTime: existingHour?.startTime ?? '09:00',
      endTime: existingHour?.endTime ?? '17:00',
      closed: existingHour?.closed ?? false,
    };
  });
}

export function createResourceWorkingHourDrafts(
  hours?: Array<{ dayOfWeek: number; startTime: string; endTime: string; closed?: boolean }>,
): WorkingHourDraft[] {
  return (hours ?? []).map((hour) => ({
    closed: hour.closed ?? false,
    dayOfWeek: hour.dayOfWeek,
    endTime: hour.endTime,
    startTime: hour.startTime,
  }));
}

export function createEmptyWorkingHourDraft(dayOfWeek = 1): WorkingHourDraft {
  return {
    dayOfWeek,
    startTime: '09:00',
    endTime: '17:00',
    closed: false,
  };
}

export function createBlackoutDateDrafts(blackoutDates?: DateRangeDto[]): BlackoutDateDraft[] {
  return (blackoutDates ?? []).map((blackoutDate, index) => ({
    endDate: formatDateInput(blackoutDate.endDate),
    id: `${blackoutDate.startDate}-${blackoutDate.endDate}-${index}`,
    reason: blackoutDate.reason ?? '',
    startDate: formatDateInput(blackoutDate.startDate),
  }));
}

export function createEmptyBlackoutDateDraft(): BlackoutDateDraft {
  return {
    endDate: '',
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    reason: '',
    startDate: '',
  };
}

export function validateWorkingHours(hours: WorkingHourDraft[]): string | null {
  const invalidHour = hours.find((hour) => !hour.closed && (!hour.startTime || !hour.endTime || hour.startTime >= hour.endTime));

  return invalidHour ? `${getWeekdayLabel(invalidHour.dayOfWeek)} must have an end time after the start time.` : null;
}

export function validateBlackoutDates(blackoutDates: BlackoutDateDraft[]): string | null {
  const invalidRange = blackoutDates.find((range) => {
    if (!range.startDate || !range.endDate) {
      return true;
    }

    return getBlackoutRangeEndIso(range.endDate) <= getBlackoutRangeStartIso(range.startDate);
  });

  return invalidRange ? 'Each blackout range needs a start date and an end date on or after the start date.' : null;
}

export function serializeWorkingHours(hours: WorkingHourDraft[]): WorkingHourDraft[] {
  return hours
    .slice()
    .sort((left, right) => left.dayOfWeek - right.dayOfWeek)
    .map((hour) => ({
      closed: hour.closed,
      dayOfWeek: hour.dayOfWeek,
      endTime: hour.endTime,
      startTime: hour.startTime,
    }));
}

function getBlackoutRangeStartIso(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function getBlackoutRangeEndIso(value: string): string {
  return new Date(`${value}T23:59:59.999Z`).toISOString();
}

export function serializeBlackoutDates(blackoutDates: BlackoutDateDraft[]): DateRangeDto[] {
  return blackoutDates.map((range) => ({
    ...(range.reason.trim() ? { reason: range.reason.trim() } : {}),
    endDate: getBlackoutRangeEndIso(range.endDate),
    startDate: getBlackoutRangeStartIso(range.startDate),
  }));
}
