"use client";

import { useState, useEffect } from "react";

export function useScrollDirection(): "up" | "down" {
  const [direction, setDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    let lastY = window.scrollY;

    const handler = () => {
      const currentY = window.scrollY;
      setDirection(currentY > lastY ? "down" : "up");
      lastY = currentY;
    };

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return direction;
}
