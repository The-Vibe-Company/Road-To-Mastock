"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_FR = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export function DatePicker({ value, onChange, open, onOpenChange }: DatePickerProps) {
  const selected = new Date(value + "T00:00:00");
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  if (!open) return null;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelect = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    onOpenChange(false);
  };

  const isSelected = (day: number) =>
    viewYear === selected.getFullYear() &&
    viewMonth === selected.getMonth() &&
    day === selected.getDate();

  const isToday = (day: number) =>
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  // Previous month days to fill the grid
  const prevMonthDays = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/10 px-5 py-4">
          <button
            onClick={prevMonth}
            className="flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-primary/10"
          >
            <ChevronLeft className="size-5 text-primary" />
          </button>
          <h3 className="text-base font-bold tracking-tight">
            {MONTHS_FR[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={nextMonth}
            className="flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-primary/10"
          >
            <ChevronRight className="size-5 text-primary" />
          </button>
        </div>

        {/* Days grid */}
        <div className="p-4">
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {DAYS_FR.map((d, i) => (
              <div
                key={i}
                className="flex h-8 items-center justify-center text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Previous month filler */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div
                key={`prev-${i}`}
                className="flex h-10 items-center justify-center text-sm text-muted-foreground/30"
              >
                {prevMonthDays - firstDay + 1 + i}
              </div>
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const sel = isSelected(day);
              const tod = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => handleSelect(day)}
                  className={`flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition-all active:scale-90 ${
                    sel
                      ? "bg-gradient-orange-intense text-black shadow-lg glow-orange"
                      : tod
                        ? "border border-primary/40 text-primary"
                        : "text-foreground hover:bg-primary/10"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-primary/10 px-5 py-3">
          <button
            onClick={() => {
              const t = new Date();
              const m = String(t.getMonth() + 1).padStart(2, "0");
              const d = String(t.getDate()).padStart(2, "0");
              onChange(`${t.getFullYear()}-${m}-${d}`);
              onOpenChange(false);
            }}
            className="text-sm font-bold text-primary transition-colors hover:text-primary/80"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Annuler
          </button>
        </div>
      </div>
    </>
  );
}
