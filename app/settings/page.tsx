"use client";

import { useLunchBreaks } from "../hooks/useLunchBreaks";
import { TIME_SLOTS } from "../lib/schedule";

export default function SettingsPage() {
  const { lunchBreaks, updateLunchBreaks } = useLunchBreaks();

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
              updateLunchBreaks(selectedOptions);
            }}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32 p-2 bg-white"
          >
            {TIME_SLOTS.map((slot) => (
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
