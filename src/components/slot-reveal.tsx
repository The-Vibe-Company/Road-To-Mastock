"use client";

import { useEffect, useState, type ReactNode } from "react";

export interface SlotItem {
  key: string;
  render: () => ReactNode;
}

interface SlotRevealProps {
  items: SlotItem[];
  targetKey: string;
  /** Total spin duration in ms. Default 2400ms. */
  duration?: number;
  /** Total cycles to roll through (multiplier on items.length). Default 5. */
  cycles?: number;
  /** Called once the wheel settles on the target. */
  onSettle?: () => void;
  /** Wrapper class. */
  className?: string;
}

/**
 * Reusable slot-machine reveal. Rapidly cycles through `items`, decelerating
 * (ease-out cubic) and landing exactly on `items[indexOf(targetKey)]`.
 */
export function SlotReveal({
  items,
  targetKey,
  duration = 2400,
  cycles = 5,
  onSettle,
  className = "",
}: SlotRevealProps) {
  const [index, setIndex] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const targetIndex = Math.max(0, items.findIndex((i) => i.key === targetKey));
    if (items.length === 0) return;
    const totalSteps = items.length * cycles + targetIndex;
    if (totalSteps === 0) {
      setIndex(targetIndex);
      setSettled(true);
      onSettle?.();
      return;
    }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const step = Math.floor(eased * totalSteps);
      setIndex(step % items.length);
      if (t >= 1) {
        setIndex(targetIndex);
        setSettled(true);
        onSettle?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  const current = items[index];
  return (
    <div className={`relative ${className} ${settled ? "animate-card-reveal" : ""}`}>
      {current?.render()}
    </div>
  );
}
