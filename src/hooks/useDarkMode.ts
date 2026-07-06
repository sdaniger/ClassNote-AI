"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "classnote-ai:dark-mode";

export function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setDark(stored === "true");
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(STORAGE_KEY, String(dark));
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);

  return { dark, toggle };
}
