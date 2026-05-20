"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_LUNCH_BREAKS,
  LUNCH_BREAKS_STORAGE_KEY,
} from "../lib/schedule";

const readLunchBreaks = () => {
  const storedLunchBreaks = localStorage.getItem(LUNCH_BREAKS_STORAGE_KEY);

  if (!storedLunchBreaks) {
    return DEFAULT_LUNCH_BREAKS;
  }

  try {
    const parsedLunchBreaks: unknown = JSON.parse(storedLunchBreaks);

    if (
      Array.isArray(parsedLunchBreaks) &&
      parsedLunchBreaks.every((slot) => typeof slot === "string")
    ) {
      return parsedLunchBreaks;
    }
  } catch (error) {
    console.error("昼休み設定の読み込みに失敗しました。", error);
  }

  return DEFAULT_LUNCH_BREAKS;
};

export const useLunchBreaks = () => {
  const [lunchBreaks, setLunchBreaks] =
    useState<string[]>(DEFAULT_LUNCH_BREAKS);

  useEffect(() => {
    setLunchBreaks(readLunchBreaks());
  }, []);

  const updateLunchBreaks = (nextLunchBreaks: string[]) => {
    setLunchBreaks(nextLunchBreaks);
    localStorage.setItem(
      LUNCH_BREAKS_STORAGE_KEY,
      JSON.stringify(nextLunchBreaks)
    );
  };

  return { lunchBreaks, updateLunchBreaks };
};
