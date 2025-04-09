"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [lunchBreaks, setLunchBreaks] = useState<string[]>(["12:00-13:00"]);

  useEffect(() => {
    const storedLunchBreaks = localStorage.getItem("lunchBreaks");
    if (storedLunchBreaks) {
      setLunchBreaks(JSON.parse(storedLunchBreaks));
    }
  }, []);

  const handleLunchBreakChange = (selectedOptions: string[]) => {
    setLunchBreaks(selectedOptions);
    localStorage.setItem("lunchBreaks", JSON.stringify(selectedOptions));
  };

  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = 9 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const nextMinute = i % 2 === 0 ? "30" : "00";
    const nextHour = i % 2 === 0 ? hour : hour + 1;
    return `${hour.toString().padStart(2, "0")}:${minute}-${nextHour
      .toString()
      .padStart(2, "0")}:${nextMinute}`;
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">設定ページ</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          昼休みの時間帯を設定
        </label>
        <div className="relative">
          <select
            multiple
            value={lunchBreaks}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions).map(
                (option) => option.value
              );
              handleLunchBreakChange(selectedOptions);
            }}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32 p-2 bg-white"
          >
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
