import dayjs, { type Dayjs } from "dayjs";

export interface DateOption {
  date: string;
  timeRange: string;
}

export interface ScheduleSummary {
  date: string;
  label: string;
  groupedTimeRanges: string;
}

export const DEFAULT_LUNCH_BREAKS = ["12:00-13:00"];
export const LUNCH_BREAKS_STORAGE_KEY = "lunchBreaks";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export const TIME_SLOTS = Array.from({ length: 16 }, (_, index) => {
  const hour = 9 + Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  const nextMinute = index % 2 === 0 ? "30" : "00";
  const nextHour = index % 2 === 0 ? hour : hour + 1;

  return `${hour.toString().padStart(2, "0")}:${minute}-${nextHour
    .toString()
    .padStart(2, "0")}:${nextMinute}`;
});

export const createWeekDays = (weekStart: Dayjs) =>
  Array.from({ length: 7 }, (_, index) => weekStart.add(index, "day"));

export const formatDateKey = (date: Dayjs) => date.format("YYYY-MM-DD");

export const formatDateLabel = (date: Dayjs) => date.format("M月D日");

export const formatWeekRangeLabel = (weekStart: Dayjs) =>
  `${formatDateLabel(weekStart)} 〜 ${formatDateLabel(weekStart.add(6, "day"))}`;

export const getWeekdayLabel = (date: Dayjs) => WEEKDAY_LABELS[date.day()];

export const isPastDate = (date: string) => dayjs(date).isBefore(dayjs(), "day");

const getTimeSlotIndex = (timeRange: string) => TIME_SLOTS.indexOf(timeRange);

export const buildSelectionKey = (date: string, timeRange: string) =>
  `${date}__${timeRange}`;

export const groupTimeRanges = (selectedDates: DateOption[], date: string) => {
  const times = selectedDates
    .filter((option) => option.date === date)
    .map((option) => option.timeRange)
    .sort((left, right) => getTimeSlotIndex(left) - getTimeSlotIndex(right));

  if (times.length === 0) {
    return "";
  }

  const grouped: string[] = [];
  let startTime = "";

  times.forEach((time, index) => {
    const [start, end] = time.split("-");

    if (!startTime) {
      startTime = start;
    }

    const nextTime = times[index + 1];
    const isContinuous =
      nextTime !== undefined &&
      getTimeSlotIndex(nextTime) === getTimeSlotIndex(time) + 1;

    if (!isContinuous) {
      grouped.push(`${startTime}-${end}`);
      startTime = "";
    }
  });

  return grouped.join(", ");
};

export const buildScheduleSummaries = (
  days: Dayjs[],
  selectedDates: DateOption[]
) =>
  days
    .map((day) => {
      const date = formatDateKey(day);
      const groupedTimeRanges = groupTimeRanges(selectedDates, date);

      if (!groupedTimeRanges) {
        return null;
      }

      return {
        date,
        label: formatDateLabel(day),
        groupedTimeRanges,
      } satisfies ScheduleSummary;
    })
    .filter((summary): summary is ScheduleSummary => summary !== null);

export const formatScheduleSummariesForClipboard = (
  scheduleSummaries: ScheduleSummary[]
) =>
  scheduleSummaries
    .map((summary) => `${summary.label} ${summary.groupedTimeRanges}`)
    .join("\n");
