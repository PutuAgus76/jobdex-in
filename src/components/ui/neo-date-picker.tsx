"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NeoDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const WEEKDAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function NeoDatePicker({
  value,
  onChange,
  id,
  placeholder = "Pilih tanggal...",
}: NeoDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close calendar popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      }
    }
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday ...
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayNum: number, relativeMonth: "prev" | "current" | "next") => {
    let targetYear = year;
    let targetMonth = month;

    if (relativeMonth === "prev") {
      targetMonth -= 1;
      if (targetMonth < 0) {
        targetMonth = 11;
        targetYear -= 1;
      }
    } else if (relativeMonth === "next") {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }

    // Format YYYY-MM-DD
    const yyyy = String(targetYear);
    const mm = String(targetMonth + 1).padStart(2, "0");
    const dd = String(dayNum).padStart(2, "0");
    const formatted = `${yyyy}-${mm}-${dd}`;

    onChange(formatted);
    setIsOpen(false);
  };

  // Generate 42 calendar grid cells
  const gridCells = [];

  // 1. Prev month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    gridCells.push({
      day: totalDaysInPrevMonth - i,
      monthType: "prev" as const,
    });
  }

  // 2. Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    gridCells.push({
      day: i,
      monthType: "current" as const,
    });
  }

  // 3. Next month leading days
  const remainingCells = 42 - gridCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    gridCells.push({
      day: i,
      monthType: "next" as const,
    });
  }

  // Check if cell matches the selected date
  const isSelected = (dayNum: number, monthType: "prev" | "current" | "next") => {
    if (!value) return false;
    const dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) return false;

    let checkYear = year;
    let checkMonth = month;

    if (monthType === "prev") {
      checkMonth -= 1;
      if (checkMonth < 0) {
        checkMonth = 11;
        checkYear -= 1;
      }
    } else if (monthType === "next") {
      checkMonth += 1;
      if (checkMonth > 11) {
        checkMonth = 0;
        checkYear += 1;
      }
    }

    return (
      dateObj.getFullYear() === checkYear &&
      dateObj.getMonth() === checkMonth &&
      dateObj.getDate() === dayNum
    );
  };

  // Check if cell is today
  const isToday = (dayNum: number, monthType: "prev" | "current" | "next") => {
    const today = new Date();
    let checkYear = year;
    let checkMonth = month;

    if (monthType === "prev") {
      checkMonth -= 1;
      if (checkMonth < 0) {
        checkMonth = 11;
        checkYear -= 1;
      }
    } else if (monthType === "next") {
      checkMonth += 1;
      if (checkMonth > 11) {
        checkMonth = 0;
        checkYear += 1;
      }
    }

    return (
      today.getFullYear() === checkYear &&
      today.getMonth() === checkMonth &&
      today.getDate() === dayNum
    );
  };

  const formattedDisplay = () => {
    if (!value) return "";
    const dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) return value;

    const d = dateObj.getDate();
    const m = MONTH_NAMES[dateObj.getMonth()].slice(0, 3);
    const y = dateObj.getFullYear();
    return `${d} ${m} ${y}`;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <Input
          id={id}
          value={formattedDisplay()}
          placeholder={placeholder}
          readOnly
          className="w-full cursor-pointer pr-10"
        />
        <CalendarIcon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-[280px] rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow font-sans left-0 md:left-auto md:right-0">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-border mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-[4px] border-2 border-border bg-white text-slate-900 shadow-[1px_1px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[0.5px_0.5px_0px_#000]"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-black text-foreground">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-[4px] border-2 border-border bg-white text-slate-900 shadow-[1px_1px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[0.5px_0.5px_0px_#000]"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((name) => (
              <span key={name} className="text-[10px] font-black text-slate-500 uppercase">
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {gridCells.map((cell, idx) => {
              const active = isSelected(cell.day, cell.monthType);
              const today = isToday(cell.day, cell.monthType);
              const current = cell.monthType === "current";

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDaySelect(cell.day, cell.monthType)}
                  className={`size-8 text-xs font-bold rounded-[4px] flex items-center justify-center transition-all ${
                    active
                      ? "bg-[var(--main)] text-neutral-950 border-2 border-border shadow-[1px_1px_0px_#000]"
                      : today
                      ? "bg-white text-foreground border-2 border-dashed border-border"
                      : current
                      ? "bg-white text-foreground hover:bg-slate-100 hover:border-2 hover:border-border hover:shadow-[1px_1px_0px_#000] border border-transparent"
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-transparent"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
