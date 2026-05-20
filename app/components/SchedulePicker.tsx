"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useLunchBreaks } from "../hooks/useLunchBreaks";
import { useScheduleSelection } from "../hooks/useScheduleSelection";
import {
  buildSelectionKey,
  buildScheduleSummaries,
  createWeekDays,
  formatDateKey,
  formatScheduleSummariesForClipboard,
  formatWeekRangeLabel,
  getWeekdayLabel,
  isPastDate,
  TIME_SLOTS,
  type ScheduleSummary,
} from "../lib/schedule";

interface WeekNavigatorProps {
  weekLabel: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

interface ScheduleDayColumnProps {
  day: Dayjs;
  lunchBreaks: string[];
  isSelected: (date: string, timeRange: string) => boolean;
  areAllSelected: (date: string, timeRanges: string[]) => boolean;
  onSlotPointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    date: string,
    timeRange: string,
    isDisabled: boolean
  ) => void;
  onSlotPointerEnter: (
    event: PointerEvent<HTMLButtonElement>,
    date: string,
    timeRange: string,
    isDisabled: boolean
  ) => void;
  onSlotClick: (
    event: MouseEvent<HTMLButtonElement>,
    date: string,
    timeRange: string,
    isDisabled: boolean
  ) => void;
  onStopDragSelection: () => void;
  onToggleDaySelection: (date: string, timeRanges: string[]) => void;
}

interface SelectionSidebarProps {
  scheduleSummaries: ScheduleSummary[];
  onCopy: () => void;
  onClear: () => void;
}

const WeekNavigator = ({
  weekLabel,
  onPreviousWeek,
  onNextWeek,
}: WeekNavigatorProps) => (
  <div className="mb-4 flex items-center justify-between gap-4">
    <button
      type="button"
      onClick={onPreviousWeek}
      className="rounded bg-gray-200 p-2 transition hover:bg-gray-300"
      aria-label="前の週へ移動"
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </button>
    <span className="text-lg font-semibold">{weekLabel}</span>
    <button
      type="button"
      onClick={onNextWeek}
      className="rounded bg-gray-200 p-2 transition hover:bg-gray-300"
      aria-label="次の週へ移動"
    >
      <ChevronRightIcon className="h-5 w-5" />
    </button>
  </div>
);

const ScheduleDayColumn = ({
  day,
  lunchBreaks,
  isSelected,
  areAllSelected,
  onSlotPointerDown,
  onSlotPointerEnter,
  onSlotClick,
  onStopDragSelection,
  onToggleDaySelection,
}: ScheduleDayColumnProps) => {
  const dateKey = formatDateKey(day);
  const isPast = isPastDate(dateKey);
  const selectableSlots = TIME_SLOTS.filter((slot) => !lunchBreaks.includes(slot));
  const isColumnSelected = !isPast && areAllSelected(dateKey, selectableSlots);
  const weekdayClassName =
    day.day() === 0
      ? "bg-red-100"
      : day.day() === 6
      ? "bg-blue-100"
      : "bg-gray-100";

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onToggleDaySelection(dateKey, selectableSlots)}
        disabled={isPast}
        className={`py-2 text-center font-semibold transition ${
          isPast
            ? `${weekdayClassName} cursor-not-allowed text-gray-500`
            : isColumnSelected
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : `${weekdayClassName} hover:brightness-95`
        }`}
      >
        {getWeekdayLabel(day)}
      </button>
      <div className="flex-1 p-4">
        <h2 className="mb-3 text-center text-lg font-semibold">
          {day.format("M月D日")}
        </h2>
        <div className="grid gap-2">
          {TIME_SLOTS.map((slot) => {
            const isLunchBreak = lunchBreaks.includes(slot);
            const isDisabled = isPast || isLunchBreak;

            return (
              <button
                key={slot}
                type="button"
                onPointerDown={(event) =>
                  onSlotPointerDown(event, dateKey, slot, isDisabled)
                }
                onPointerEnter={(event) =>
                  onSlotPointerEnter(event, dateKey, slot, isDisabled)
                }
                onPointerUp={onStopDragSelection}
                onPointerCancel={onStopDragSelection}
                onClick={(event) => onSlotClick(event, dateKey, slot, isDisabled)}
                disabled={isDisabled}
                className={`select-none rounded border px-2 py-1 text-sm transition ${
                  isDisabled
                    ? "cursor-not-allowed bg-gray-300 text-gray-500"
                    : isSelected(dateKey, slot)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SelectionSidebar = ({
  scheduleSummaries,
  onCopy,
  onClear,
}: SelectionSidebarProps) => (
  <aside className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-100 p-4">
    {scheduleSummaries.length > 0 ? (
      <>
        <h2 className="mb-2 text-lg font-semibold">選択された候補日</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
          >
            <ClipboardDocumentIcon className="h-5 w-5" />
            コピー
          </button>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-2 rounded bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
          >
            <TrashIcon className="h-5 w-5" />
            クリア
          </button>
        </div>
        <ul className="space-y-2 rounded bg-white p-4">
          {scheduleSummaries.map((summary) => (
            <li
              key={summary.date}
              className="rounded border bg-gray-50 p-2 shadow-sm"
            >
              {summary.label}: {summary.groupedTimeRanges}
            </li>
          ))}
        </ul>
      </>
    ) : (
      <p className="text-gray-500">候補日が選択されていません。</p>
    )}
  </aside>
);

export default function SchedulePicker() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    dayjs().startOf("week")
  );
  const { lunchBreaks } = useLunchBreaks();
  const dragSelectionRef = useRef<{
    shouldSelect: boolean;
    visitedKeys: Set<string>;
  } | null>(null);
  const suppressedClickKeyRef = useRef<string | null>(null);

  const days = useMemo(
    () => createWeekDays(currentWeekStart),
    [currentWeekStart]
  );
  const {
    selectedDates,
    isSelected,
    areAllSelected,
    selectSlot,
    setSlotSelection,
    toggleDaySelection,
    clearSelections,
  } =
    useScheduleSelection(days);

  const scheduleSummaries = useMemo(
    () => buildScheduleSummaries(days, selectedDates),
    [days, selectedDates]
  );

  const copyToClipboard = async () => {
    const formattedText = formatScheduleSummariesForClipboard(scheduleSummaries);

    await navigator.clipboard.writeText(formattedText);
    alert("選択した候補日がクリップボードにコピーされました。");
  };

  const stopDragSelection = useCallback(() => {
    dragSelectionRef.current = null;
    window.requestAnimationFrame(() => {
      suppressedClickKeyRef.current = null;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("pointerup", stopDragSelection);
    window.addEventListener("pointercancel", stopDragSelection);

    return () => {
      window.removeEventListener("pointerup", stopDragSelection);
      window.removeEventListener("pointercancel", stopDragSelection);
    };
  }, [stopDragSelection]);

  const handleSlotPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    date: string,
    timeRange: string,
    isDisabled: boolean
  ) => {
    if (isDisabled || event.button !== 0) {
      return;
    }

    event.preventDefault();

    const selectionKey = buildSelectionKey(date, timeRange);
    suppressedClickKeyRef.current = selectionKey;

    if (event.shiftKey) {
      selectSlot(date, timeRange, true);
      stopDragSelection();
      return;
    }

    const shouldSelect = !isSelected(date, timeRange);
    dragSelectionRef.current = {
      shouldSelect,
      visitedKeys: new Set([selectionKey]),
    };
    setSlotSelection(date, timeRange, shouldSelect);
  };

  const handleSlotPointerEnter = (
    event: PointerEvent<HTMLButtonElement>,
    date: string,
    timeRange: string,
    isDisabled: boolean
  ) => {
    if (isDisabled || (event.buttons & 1) !== 1) {
      return;
    }

    const dragSelection = dragSelectionRef.current;

    if (!dragSelection) {
      return;
    }

    const selectionKey = buildSelectionKey(date, timeRange);

    if (dragSelection.visitedKeys.has(selectionKey)) {
      return;
    }

    dragSelection.visitedKeys.add(selectionKey);
    setSlotSelection(date, timeRange, dragSelection.shouldSelect);
  };

  const handleSlotClick = (
    event: MouseEvent<HTMLButtonElement>,
    date: string,
    timeRange: string,
    isDisabled: boolean
  ) => {
    if (isDisabled) {
      return;
    }

    const selectionKey = buildSelectionKey(date, timeRange);

    if (suppressedClickKeyRef.current === selectionKey) {
      suppressedClickKeyRef.current = null;
      return;
    }

    selectSlot(date, timeRange, event.shiftKey);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-4 text-2xl font-bold">日程調整</h1>
      <WeekNavigator
        weekLabel={formatWeekRangeLabel(currentWeekStart)}
        onPreviousWeek={() =>
          setCurrentWeekStart((current) => current.subtract(1, "week"))
        }
        onNextWeek={() =>
          setCurrentWeekStart((current) => current.add(1, "week"))
        }
      />
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex-1">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            {days.map((day) => (
              <ScheduleDayColumn
                key={formatDateKey(day)}
                day={day}
                lunchBreaks={lunchBreaks}
                isSelected={isSelected}
                areAllSelected={areAllSelected}
                onSlotPointerDown={handleSlotPointerDown}
                onSlotPointerEnter={handleSlotPointerEnter}
                onSlotClick={handleSlotClick}
                onStopDragSelection={stopDragSelection}
                onToggleDaySelection={toggleDaySelection}
              />
            ))}
          </div>
        </div>
        <SelectionSidebar
          scheduleSummaries={scheduleSummaries}
          onCopy={copyToClipboard}
          onClear={clearSelections}
        />
      </div>
    </div>
  );
}
