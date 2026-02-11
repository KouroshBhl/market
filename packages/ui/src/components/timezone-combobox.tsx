"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../lib/utils";

// Get all IANA timezones
function getAllTimezones(): string[] {
  // Try to use Intl.supportedValuesOf if available (modern browsers)
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    try {
      return (Intl as any).supportedValuesOf("timeZone");
    } catch {
      // Fallback to common timezones
    }
  }

  // Fallback list of common timezones
  return [
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "America/Anchorage",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/New_York",
    "America/Sao_Paulo",
    "America/Toronto",
    "Asia/Bangkok",
    "Asia/Dubai",
    "Asia/Hong_Kong",
    "Asia/Jakarta",
    "Asia/Kolkata",
    "Asia/Manila",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Tehran",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Europe/Amsterdam",
    "Europe/Athens",
    "Europe/Berlin",
    "Europe/Brussels",
    "Europe/Istanbul",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Moscow",
    "Europe/Paris",
    "Europe/Rome",
    "Europe/Stockholm",
    "Europe/Vienna",
    "Pacific/Auckland",
    "Pacific/Fiji",
    "Pacific/Honolulu",
    "UTC",
  ];
}

interface TimezoneComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  id?: string;
}

export function TimezoneCombobox({
  value,
  onChange,
  placeholder = "Select timezone...",
  id,
}: TimezoneComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const timezones = React.useMemo(() => getAllTimezones().sort(), []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {timezones.map((tz) => (
                <CommandItem
                  key={tz}
                  value={tz}
                  onSelect={() => {
                    onChange(tz === value ? null : tz);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === tz ? "opacity-100" : "opacity-0")}
                  />
                  {tz}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
