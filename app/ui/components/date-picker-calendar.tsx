"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatDateToLocal } from "@/app/lib/utils";

interface DatePickerCalendarProps {
    availableDates: string[];
    selectedDate?: string;
    onChange: (date: string) => void;
    placeholder?: string;
}

export default function DatePickerCalendar({
    availableDates,
    selectedDate,
    onChange,
    placeholder = "Selecionar data",
}: DatePickerCalendarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [displayDate, setDisplayDate] = useState<string | undefined>(
        selectedDate,
    );
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);

    // Sync display date with selected date prop
    useEffect(() => {
        setDisplayDate(selectedDate);
    }, [selectedDate]);

    // Parse available dates to a Set for O(1) lookup
    const availableDateSet = new Set(
        availableDates.map(
            (date) => new Date(date).toISOString().split("T")[0],
        ),
    );

    // Get the year and month of the current view
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Generate calendar days
    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(new Date(year, month, day));
    }

    // Check if a date has data available
    const hasData = (date: Date): boolean => {
        const dateString = date.toISOString().split("T")[0];
        return availableDateSet.has(dateString);
    };

    // Format date for display
    const getDisplayDate = (date: string | undefined): string => {
        if (!date) return placeholder;
        return formatDateToLocal(date);
    };

    // Handle date selection
    const handleSelectDate = (date: Date) => {
        const dateString = date.toISOString().split("T")[0];
        setDisplayDate(dateString);
        onChange(dateString);
        setIsOpen(false);
    };

    // Handle month navigation
    const handlePrevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
    };

    // Handle clear selection
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDisplayDate("");
        onChange("");
    };

    // Close calendar when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                calendarRef.current &&
                !calendarRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ];

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

    return (
        <div className="relative w-full" ref={calendarRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
            >
                <span className="flex-1 text-left">
                    {getDisplayDate(displayDate)}
                </span>
                <div className="flex items-center gap-1">
                    {displayDate && (
                        <X
                            className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            onClick={handleClear}
                        />
                    )}
                    <svg
                        className={`w-4 h-4 transition-transform ${
                            isOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 w-80">
                    {/* Month/Year Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {monthNames[month]} {year}
                        </span>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Day names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map((day) => (
                            <div
                                key={day}
                                className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-1"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, index) => {
                            if (!date) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        className="aspect-square"
                                    />
                                );
                            }

                            const dateString = date.toISOString().split("T")[0];
                            const isAvailable = hasData(date);
                            const isSelected = displayDate === dateString;

                            return (
                                <button
                                    key={dateString}
                                    type="button"
                                    onClick={() =>
                                        isAvailable && handleSelectDate(date)
                                    }
                                    disabled={!isAvailable}
                                    className={`
                                        aspect-square text-sm rounded flex items-center justify-center
                                        transition-colors font-medium
                                        ${
                                            !isAvailable
                                                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                                : isSelected
                                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                                  : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                        }
                                        ${
                                            isAvailable && !isSelected
                                                ? "border border-gray-200 dark:border-gray-700"
                                                : ""
                                        }
                                    `}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
