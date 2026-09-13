'use client';

import { Localize } from '@deriv-com/translations';
import { cn } from '@/lib/utils';
import type { DigitStats } from '../lib/types';

const DIGITS = Array.from({ length: 10 }, (_, index) => index);

interface DigitCircleBoardProps {
  digitStats: DigitStats;
  lastDigit: number | null;
  /** Ticks epoch of the current tick — changing this retriggers the pulse even when the digit repeats. */
  tickKey?: number;
  selectedDigit: number;
  onDigitSelect: (digit: number) => void;
  /** When false, circles show the last-digit cursor but aren't clickable (e.g. Even/Odd mode). */
  selectable?: boolean;
}

/**
 * The digit board: circles for 0-9 with frequency stats, and a cursor that
 * glides along the row to sit above whichever digit the market just printed.
 */
export function DigitCircleBoard({
  digitStats,
  lastDigit,
  tickKey,
  selectedDigit,
  onDigitSelect,
  selectable = true,
}: DigitCircleBoardProps) {
  const maxPct = Math.max(...digitStats.percentages);
  const minPct = Math.min(...digitStats.percentages);
  const cursorLeft = lastDigit !== null ? lastDigit * 10 : null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground sm:text-sm">
        <Localize i18n_default_text="Last digit" />
      </span>

      <div className="relative pt-4">
        {/* Moving cursor — glides to the digit the last tick printed */}
        {cursorLeft !== null && (
          <div
            className="absolute top-0 flex w-[10%] justify-center transition-[left] duration-300 ease-out"
            style={{ left: `${cursorLeft}%` }}
          >
            <div
              key={tickKey}
              className="h-0 w-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-primary [animation:bounce_0.5s_ease-out]"
            />
          </div>
        )}

        <div className="flex w-full">
          {DIGITS.map((digit) => {
            const pct = digitStats.percentages[digit] ?? 0;
            const isLast = digit === lastDigit;
            const isSelected = digit === selectedDigit;
            const isHighest = digitStats.totalTicks > 0 && pct === maxPct;
            const isLowest = digitStats.totalTicks > 0 && pct === minPct;

            return (
              <div key={digit} className="flex w-[10%] flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => selectable && onDigitSelect(digit)}
                  aria-pressed={isSelected}
                  className={cn(
                    'relative flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition-all sm:size-12 sm:text-lg',
                    !selectable && 'cursor-default',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/20 bg-muted/50 hover:bg-muted',
                    isLast && !isSelected && 'border-primary/70 ring-2 ring-primary/30'
                  )}
                >
                  {digit}
                  {isLast && (
                    <span
                      key={tickKey}
                      className="absolute inset-0 rounded-full bg-primary/30 [animation:ping_0.8s_cubic-bezier(0,0,0.2,1)]"
                    />
                  )}
                </button>
                <span
                  className={cn(
                    'text-[10px] font-mono sm:text-xs',
                    isHighest && 'font-semibold text-green-500',
                    isLowest && 'font-semibold text-red-500',
                    !isHighest && !isLowest && 'text-muted-foreground'
                  )}
                >
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
