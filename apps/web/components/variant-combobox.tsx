"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Button,
  Label,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Badge,
} from "@workspace/ui";

const SEARCH_THRESHOLD = 6;

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  hint?: string;
}

interface VariantComboboxProps {
  id: string;
  label: string;
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function VariantCombobox({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
}: VariantComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = options.find((o) => o.value === value);
  const showSearch = options.length >= SEARCH_THRESHOLD;

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[180px] justify-between text-sm h-9"
          >
            <span className="truncate">
              {selectedOption?.label ?? placeholder}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-0" align="start">
          <Command>
            {showSearch && (
              <CommandInput
                placeholder={`Search ${label.toLowerCase()}…`}
                value={search}
                onValueChange={setSearch}
              />
            )}
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      if (!option.disabled) {
                        onChange(currentValue);
                        setOpen(false);
                        setSearch("");
                      }
                    }}
                    disabled={option.disabled}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check
                        className={`size-4 shrink-0 ${
                          value === option.value ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <span className="truncate">{option.label}</span>
                    </div>
                    {option.disabled && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 shrink-0"
                      >
                        Unavailable
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
