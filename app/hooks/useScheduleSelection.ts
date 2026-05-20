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

  const areAllSelected = (date: string, timeRanges: string[]) =>
    timeRanges.length > 0 &&
    timeRanges.every((timeRange) =>
      selectedKeys.has(buildSelectionKey(date, timeRange))
    );

  const updateSelectionState = (
    currentSelections: DateOption[],
    date: string,
    timeRange: string,
    shouldSelect: boolean
  ) => {
    const selectionKey = buildSelectionKey(date, timeRange);
    const hasSelection = currentSelections.some(
      (option) => buildSelectionKey(option.date, option.timeRange) === selectionKey
    );

    if (hasSelection === shouldSelect) {
      return currentSelections;
    }

    if (shouldSelect) {
      return [...currentSelections, { date, timeRange }];
    }

    return currentSelections.filter(
      (option) => buildSelectionKey(option.date, option.timeRange) !== selectionKey
    );
  };

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

  const setSlotSelection = (
    date: string,
    timeRange: string,
    shouldSelect: boolean
  ) => {
    setSelectedDates((currentSelections) =>
      updateSelectionState(currentSelections, date, timeRange, shouldSelect)
    );
    setLastSelected({ date, timeRange });
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

  const toggleDaySelection = (date: string, timeRanges: string[]) => {
    if (timeRanges.length === 0) {
      return;
    }

    setSelectedDates((currentSelections) => {
      const selectionKeys = new Set(
        currentSelections.map((option) =>
          buildSelectionKey(option.date, option.timeRange)
        )
      );
      const targetKeys = timeRanges.map((timeRange) =>
        buildSelectionKey(date, timeRange)
      );
      const shouldClear = targetKeys.every((selectionKey) =>
        selectionKeys.has(selectionKey)
      );

      if (shouldClear) {
        const targetKeySet = new Set(targetKeys);

        return currentSelections.filter(
          (option) =>
            !targetKeySet.has(buildSelectionKey(option.date, option.timeRange))
        );
      }

      const nextSelections = [...currentSelections];

      timeRanges.forEach((timeRange) => {
        const selectionKey = buildSelectionKey(date, timeRange);

        if (!selectionKeys.has(selectionKey)) {
          nextSelections.push({ date, timeRange });
          selectionKeys.add(selectionKey);
        }
      });

      return nextSelections;
    });

    setLastSelected(null);
  };

  const clearSelections = () => {
    setSelectedDates([]);
    setLastSelected(null);
  };

  return {
    selectedDates,
    isSelected,
    areAllSelected,
    selectSlot,
    setSlotSelection,
    toggleDaySelection,
    clearSelections,
  };
};
