"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";

interface DateOption {
  date: string;
  timeRange: string;
}

interface WeeklySelection {
  weekStart: string; // 週の開始日 (例: "2023-10-01")
  dates: DateOption[]; // その週の選択データ
}

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    slots.push(
      `${hour.toString().padStart(2, "0")}:00-${hour
        .toString()
        .padStart(2, "0")}:30`
    );
    slots.push(
      `${hour.toString().padStart(2, "0")}:30-${(hour + 1)
        .toString()
        .padStart(2, "0")}:00`
    );
  }
  return slots;
};

const timeSlots = generateTimeSlots();

export default function SchedulePicker() {
  const [selectedDates, setSelectedDates] = useState<DateOption[]>([]);
  const [lastSelected, setLastSelected] = useState<{
    date: string;
    timeRange: string;
  } | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    dayjs().startOf("week")
  );
  const [lunchBreaks, setLunchBreaks] = useState<string[]>([]);
  const [weeklySelections, setWeeklySelections] = useState<WeeklySelection[]>(
    []
  );

  useEffect(() => {
    const storedLunchBreaks = localStorage.getItem("lunchBreaks");
    if (storedLunchBreaks) {
      setLunchBreaks(JSON.parse(storedLunchBreaks));
    } else {
      setLunchBreaks(["12:00-13:00"]);
    }
  }, []);

  const updateWeeklySelections = () => {
    const groupedByWeek: { [key: string]: DateOption[] } = {};

    selectedDates.forEach((dateOption) => {
      const weekStart = dayjs(dateOption.date)
        .startOf("week")
        .format("YYYY-MM-DD");
      if (!groupedByWeek[weekStart]) {
        groupedByWeek[weekStart] = [];
      }
      groupedByWeek[weekStart].push(dateOption);
    });

    const newWeeklySelections = Object.entries(groupedByWeek).map(
      ([weekStart, dates]) => ({ weekStart, dates })
    );

    setWeeklySelections(newWeeklySelections);
  };

  useEffect(() => {
    updateWeeklySelections();
  }, [selectedDates]);

  const toggleSelection = (date: string, timeRange: string) => {
    const exists = selectedDates.some(
      (option) => option.date === date && option.timeRange === timeRange
    );
    if (exists) {
      setSelectedDates(
        selectedDates.filter(
          (option) => !(option.date === date && option.timeRange === timeRange)
        )
      );
    } else {
      setSelectedDates([...selectedDates, { date, timeRange }]);
    }
  };

  const handleShiftSelection = (date: string, timeRange: string) => {
    if (lastSelected) {
      const lastDateIndex = days.findIndex(
        (d) => d.format("YYYY-MM-DD") === lastSelected.date
      );
      const currentDateIndex = days.findIndex(
        (d) => d.format("YYYY-MM-DD") === date
      );

      const startDateIndex = Math.min(lastDateIndex, currentDateIndex);
      const endDateIndex = Math.max(lastDateIndex, currentDateIndex);

      const startSlotIndex = timeSlots.indexOf(lastSelected.timeRange);
      const endSlotIndex = timeSlots.indexOf(timeRange);

      const startTimeIndex = Math.min(startSlotIndex, endSlotIndex);
      const endTimeIndex = Math.max(startSlotIndex, endSlotIndex);

      const newSelections: DateOption[] = [];

      for (let i = startDateIndex; i <= endDateIndex; i++) {
        for (let j = startTimeIndex; j <= endTimeIndex; j++) {
          const currentDate = days[i].format("YYYY-MM-DD");
          const currentTimeRange = timeSlots[j];
          if (!isSelected(currentDate, currentTimeRange)) {
            newSelections.push({
              date: currentDate,
              timeRange: currentTimeRange,
            });
          }
        }
      }

      setSelectedDates([...selectedDates, ...newSelections]);
    } else {
      toggleSelection(date, timeRange);
    }
    setLastSelected({ date, timeRange });
  };

  const isSelected = (date: string, timeRange: string) => {
    return selectedDates.some(
      (option) => option.date === date && option.timeRange === timeRange
    );
  };

  const isPastDate = (date: string) => {
    return dayjs(date).isBefore(dayjs(), "day");
  };

  const groupTimeRanges = (date: string) => {
    const times = selectedDates
      .filter((option) => option.date === date)
      .map((option) => option.timeRange)
      .sort();

    const grouped: string[] = [];
    let startTime = "";
    let endTime = "";

    times.forEach((time, index) => {
      const [start, end] = time.split("-");
      if (!startTime) {
        startTime = start;
      }
      if (
        index === times.length - 1 ||
        timeSlots.indexOf(times[index + 1]) !== timeSlots.indexOf(time) + 1
      ) {
        endTime = end;
        const range = `${startTime}-${endTime}`;
        if (!grouped.includes(range)) {
          grouped.push(range);
        }
        startTime = "";
      }
    });

    console.log("Grouped time ranges for date:", date, "are:", grouped);

    return grouped.join(", ");
  };

  const copyToClipboard = () => {
    const formattedDates = weeklySelections
      .flatMap((week) => {
        return Array.from(
          new Set(
            week.dates.map((dateOption) => {
              const groupedTimeRanges = groupTimeRanges(dateOption.date);
              return groupedTimeRanges
                ? `${dayjs(dateOption.date).format(
                    "M月D日"
                  )} ${groupedTimeRanges}`
                : null;
            })
          )
        ).filter(Boolean);
      })
      .join("\n");

    navigator.clipboard.writeText(formattedDates).then(() => {
      alert("選択した候補日がクリップボードにコピーされました！");
    });
  };

  const renderWeeklySelections = () => {
    return weeklySelections.map((week) => (
      <div key={week.weekStart} className="mb-4">
        <h3 className="text-md font-semibold mb-2">
          {dayjs(week.weekStart).format("M月D日")}週
        </h3>
        <ul className="bg-white p-4 rounded space-y-2">
          {Array.from(
            new Set(
              week.dates.map((dateOption) => {
                const groupedTimeRanges = groupTimeRanges(dateOption.date);
                return groupedTimeRanges
                  ? `${dayjs(dateOption.date).format(
                      "M月D日"
                    )}: ${groupedTimeRanges}`
                  : null;
              })
            )
          )
            .filter(Boolean)
            .map((uniqueEntry, index) => (
              <li
                key={index}
                className="p-2 border rounded shadow-sm bg-gray-50"
              >
                {uniqueEntry}
              </li>
            ))}
        </ul>
      </div>
    ));
  };

  const days = Array.from({ length: 7 }, (_, i) =>
    currentWeekStart.add(i, "day")
  );

  const goToPreviousWeek = () => {
    setCurrentWeekStart(currentWeekStart.subtract(1, "week"));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(currentWeekStart.add(1, "week"));
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">日程調整</h1>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPreviousWeek}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold">
          {currentWeekStart.format("M月D日")} 〜{" "}
          {currentWeekStart.add(6, "day").format("M月D日")}
        </span>
        <button
          onClick={goToNextWeek}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex">
        <div className="flex-1">
          {/* メインコンテンツ */}
          <div className="grid grid-cols-7 gap-4">
            {days.map((day, index) => (
              <div
                key={day.format("YYYY-MM-DD")}
                className="flex flex-col border"
              >
                <div
                  className={`text-center font-semibold py-2 ${
                    index === 0
                      ? "bg-red-100"
                      : index === 6
                      ? "bg-blue-100"
                      : "bg-gray-100"
                  }`}
                >
                  {day.format("ddd")}
                </div>
                <div className="bg-white flex-1 p-4">
                  <div className="rounded-lg p-4 bg-white">
                    <h2 className="text-lg font-semibold mb-2 text-center">
                      {day.format("M月D日")}
                    </h2>
                    <div className="grid grid-cols-1 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={(e) => {
                            if (!isPastDate(day.format("YYYY-MM-DD"))) {
                              if (e.shiftKey) {
                                handleShiftSelection(
                                  day.format("YYYY-MM-DD"),
                                  slot
                                );
                              } else {
                                toggleSelection(day.format("YYYY-MM-DD"), slot);
                                setLastSelected({
                                  date: day.format("YYYY-MM-DD"),
                                  timeRange: slot,
                                });
                              }
                            }
                          }}
                          disabled={
                            isPastDate(day.format("YYYY-MM-DD")) ||
                            lunchBreaks.includes(slot)
                          }
                          className={`px-2 py-1 rounded border text-sm ${
                            isPastDate(day.format("YYYY-MM-DD")) ||
                            lunchBreaks.includes(slot)
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : isSelected(day.format("YYYY-MM-DD"), slot)
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-90 bg-gray-100 p-4 border-l overflow-y-auto">
          {/* サイドメニュー */}
          {selectedDates.length > 0 ? (
            <>
              <h2 className="text-lg font-semibold mb-2">選択された候補日</h2>
              <div className="flex justify-start mb-4 space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                >
                  <ClipboardIcon className="h-5 w-5 mr-2" />
                  コピー
                </button>
                <button
                  onClick={() => setSelectedDates([])}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
                >
                  <ClipboardIcon className="h-5 w-5 mr-2" />
                  クリア
                </button>
              </div>
              {renderWeeklySelections()}
            </>
          ) : (
            <p className="text-gray-500">候補日が選択されていません。</p>
          )}
        </div>
      </div>
    </div>
  );
}
