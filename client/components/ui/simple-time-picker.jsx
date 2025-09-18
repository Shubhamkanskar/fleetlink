"use client";

/**
 * Simple Time Picker Component
 * @fileoverview A reliable time picker using native HTML inputs
 */

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Simple Time Picker Component
 * @param {Object} props - Component props
 * @param {Date} props.value - Current time value
 * @param {Function} props.onChange - Time change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether picker is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Time picker component
 */
export function SimpleTimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  className,
  ...props
}) {
  const [timeValue, setTimeValue] = useState("");

  // Initialize time from value
  useEffect(() => {
    if (value && value instanceof Date) {
      const hours = value.getHours().toString().padStart(2, "0");
      const minutes = value.getMinutes().toString().padStart(2, "0");
      setTimeValue(`${hours}:${minutes}`);
    } else {
      setTimeValue("");
    }
  }, [value]);

  /**
   * Handle time input change
   */
  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTimeValue(newTime);

    if (newTime && onChange) {
      // Parse the time and create a new Date object
      const [hours, minutes] = newTime.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDate = new Date();
        newDate.setHours(hours, minutes, 0, 0);
        onChange(newDate);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <Label htmlFor="time-input" className="text-sm font-medium">
        Time
      </Label>
      <input
        id="time-input"
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        placeholder={placeholder}
      />
    </div>
  );
}

/**
 * Simple DateTime Picker Component
 * @param {Object} props - Component props
 * @param {Date} props.value - Current date-time value
 * @param {Function} props.onChange - Date-time change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether picker is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Date-time picker component
 */
export function SimpleDateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled = false,
  className,
  ...props
}) {
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");

  // Initialize from value
  useEffect(() => {
    if (value && value instanceof Date) {
      const date = value.toISOString().split("T")[0];
      const time = value.toTimeString().slice(0, 5);
      setDateValue(date);
      setTimeValue(time);
    } else {
      setDateValue("");
      setTimeValue("");
    }
  }, [value]);

  /**
   * Handle date change
   */
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    updateDateTime(newDate, timeValue);
  };

  /**
   * Handle time change
   */
  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    updateDateTime(dateValue, newTime);
  };

  /**
   * Update the combined date-time value
   */
  const updateDateTime = (date, time) => {
    if (date && time && onChange) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDateTime = new Date(date);
      newDateTime.setHours(hours, minutes, 0, 0);
      onChange(newDateTime);
    }
  };

  /**
   * Get minimum date (today)
   */
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Date Input */}
      <div>
        <Label htmlFor="date-input" className="text-sm font-medium">
          Date
        </Label>
        <input
          id="date-input"
          type="date"
          value={dateValue}
          onChange={handleDateChange}
          min={getMinDate()}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
          )}
        />
      </div>

      {/* Time Input */}
      <div>
        <Label htmlFor="time-input" className="text-sm font-medium">
          Time
        </Label>
        <input
          id="time-input"
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
          )}
        />
      </div>
    </div>
  );
}
