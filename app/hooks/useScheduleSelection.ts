"use client";

import { useMemo, useState } from "react";
import type { Dayjs } from "dayjs";
import {
  buildSelectionKey,
  formatDateKey,
  TIME_SLOTS,
  type DateOption,
} from "../lib/schedule";

export const useScheduleSelection = (days: Dayjs[]) => {
  const [selectedDates, setSelectedDates] = useState<DateOption[]>([]);
  const [lastSelected, setLastSelected] = useState<DateOption | null>(null);

  const dayKeys = useMemo(() => days.map(formatDateKey), [days]);

  const selectedKeys = useMemo(
    () =>
      new Set(
        selectedDates.map((option) =>
          buildSelectionKey(option.date, option.timeRange)
        )
      ),
    [selectedDates]
  );

  const isSelected = (date: string, timeRange: string) =>
    selectedKeys.has(buildSelectionKey(date, timeRange));

  const toggleSelection = (date: string, timeRange: string) => {
    setSelectedDates((currentSelections) => {
      const selectionKey = buildSelectionKey(date, timeRange);

      if (
        currentSelections.some(
          (option) => buildSelectionKey(option.date, option.timeRange) === selectionKey
        )
      ) {
        return currentSelections.filter(
          (option) =>
            buildSelectionKey(option.date, option.timeRange) !== selectionKey
        );
      }

      return [...currentSelections, { date, timeRange }];
    });
  };

  const selectRange = (date: string, timeRange: string) => {
    if (!lastSelected) {
      toggleSelection(date, timeRange);
      setLastSelected({ date, timeRange });
      return;
    }

    const lastDateIndex = dayKeys.indexOf(lastSelected.date);
    const currentDateIndex = dayKeys.indexOf(date);
    const startSlotIndex = TIME_SLOTS.indexOf(lastSelected.timeRange);
    const endSlotIndex = TIME_SLOTS.indexOf(timeRange);

    if (
      lastDateIndex === -1 ||
      currentDateIndex === -1 ||
      startSlotIndex === -1 ||
      endSlotIndex === -1
    ) {
      toggleSelection(date, timeRange);
      setLastSelected({ date, timeRange });
      return;
    }

    const startDateIndex = Math.min(lastDateIndex, currentDateIndex);
    const endDateIndex = Math.max(lastDateIndex, currentDateIndex);
    const startTimeIndex = Math.min(startSlotIndex, endSlotIndex);
    const endTimeIndex = Math.max(startSlotIndex, endSlotIndex);

    setSelectedDates((currentSelections) => {
      const nextSelections = [...currentSelections];
      const nextSelectionKeys = new Set(
        currentSelections.map((option) =>
          buildSelectionKey(option.date, option.timeRange)
        )
      );

      for (let dayIndex = startDateIndex; dayIndex <= endDateIndex; dayIndex += 1) {
        for (
          let timeIndex = startTimeIndex;
          timeIndex <= endTimeIndex;
          timeIndex += 1
        ) {
          const nextDate = dayKeys[dayIndex];
          const nextTimeRange = TIME_SLOTS[timeIndex];
          const selectionKey = buildSelectionKey(nextDate, nextTimeRange);

          if (!nextSelectionKeys.has(selectionKey)) {
            nextSelections.push({ date: nextDate, timeRange: nextTimeRange });
            nextSelectionKeys.add(selectionKey);
          }
        }
      }

      return nextSelections;
    });

    setLastSelected({ date, timeRange });
  };

  const selectSlot = (date: string, timeRange: string, withRangeSelection: boolean) => {
    if (withRangeSelection) {
      selectRange(date, timeRange);
      return;
    }

    toggleSelection(date, timeRange);
    setLastSelected({ date, timeRange });
  };

  const clearSelections = () => {
    setSelectedDates([]);
    setLastSelected(null);
  };

  return { selectedDates, isSelected, selectSlot, clearSelections };
};
