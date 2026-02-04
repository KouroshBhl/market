'use client';

import { useState, useEffect } from 'react';
import { Input, Label, Alert, AlertDescription } from '@workspace/ui';

// SLA presets for manual delivery (in minutes)
const SLA_PRESETS = [
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '24 hours', value: 1440 },
  { label: '3 days', value: 4320 },
  { label: 'Custom', value: -1 }, // -1 indicates custom input
] as const;

const MIN_SLA_MINUTES = 5;
const MAX_SLA_MINUTES = 10080; // 7 days

interface SlaSelectorProps {
  value: number | null; // estimatedDeliveryMinutes
  onChange: (minutes: number | null) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  showValidationError?: boolean;
}

export function SlaSelector({
  value,
  onChange,
  label = 'Estimated Delivery Time (SLA)',
  helperText = 'How long will it typically take you to fulfill orders? This SLA is shown to buyers.',
  required = false,
  showValidationError = false,
}: SlaSelectorProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Determine if current value matches a preset or is custom
  useEffect(() => {
    if (value === null || value === undefined) {
      setIsCustomMode(false);
      setCustomValue('');
      return;
    }

    const matchesPreset = SLA_PRESETS.slice(0, -1).some((p) => p.value === value);
    if (!matchesPreset) {
      setIsCustomMode(true);
      setCustomValue(String(value));
    } else {
      setIsCustomMode(false);
      setCustomValue('');
    }
  }, [value]);

  const handlePresetClick = (presetValue: number) => {
    if (presetValue === -1) {
      // Custom mode
      setIsCustomMode(true);
      setCustomValue('');
      onChange(null);
      setValidationError(null);
    } else {
      // Preset selected
      setIsCustomMode(false);
      setCustomValue('');
      onChange(presetValue);
      setValidationError(null);
    }
  };

  const handleCustomValueChange = (inputValue: string) => {
    setCustomValue(inputValue);

    if (!inputValue) {
      onChange(null);
      setValidationError(null);
      return;
    }

    const numValue = parseInt(inputValue, 10);

    if (Number.isNaN(numValue)) {
      setValidationError('Please enter a valid number');
      onChange(null);
      return;
    }

    if (numValue < MIN_SLA_MINUTES) {
      setValidationError(`Minimum ${MIN_SLA_MINUTES} minutes required`);
      onChange(null);
      return;
    }

    if (numValue > MAX_SLA_MINUTES) {
      setValidationError(`Maximum ${MAX_SLA_MINUTES} minutes (7 days)`);
      onChange(null);
      return;
    }

    setValidationError(null);
    onChange(numValue);
  };

  const isPresetSelected = (presetValue: number) => {
    if (presetValue === -1) {
      return isCustomMode;
    }
    return !isCustomMode && value === presetValue;
  };

  return (
    <div className='space-y-2'>
      <Label>
        {label}
        {required && ' *'}
      </Label>

      <div className='grid grid-cols-3 gap-2'>
        {SLA_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type='button'
            onClick={() => handlePresetClick(preset.value)}
            className={`
              p-2 text-sm rounded-lg border-2 transition-all
              ${
                isPresetSelected(preset.value)
                  ? 'border-ring bg-accent text-accent-foreground'
                  : 'border-border hover:border-ring/50 text-foreground'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {isCustomMode && (
        <div className='space-y-2 mt-3'>
          <div className='flex gap-2 items-start'>
            <Input
              type='number'
              min={MIN_SLA_MINUTES}
              max={MAX_SLA_MINUTES}
              value={customValue}
              onChange={(e) => handleCustomValueChange(e.target.value)}
              placeholder={`Enter ${MIN_SLA_MINUTES}-${MAX_SLA_MINUTES}`}
              className='w-40'
            />
            <div className='flex items-center h-10'>
              <span className='text-sm text-muted-foreground'>minutes</span>
            </div>
          </div>
          {validationError && (
            <p className='text-sm text-destructive'>{validationError}</p>
          )}
        </div>
      )}

      {showValidationError && required && !value && (
        <Alert variant='destructive' className='mt-2'>
          <AlertDescription>
            Estimated delivery time is required for manual delivery offers.
          </AlertDescription>
        </Alert>
      )}

      {helperText && !validationError && (
        <p className='text-xs text-muted-foreground'>{helperText}</p>
      )}
    </div>
  );
}
