import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateTotalMinutes(mode: 'fixed' | 'duration', duration?: number | null, start?: string | null, end?: string | null): number {
  if (mode === 'duration') {
    return duration || 0;
  }
  
  if (mode === 'fixed' && start && end) {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let total = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (total < 0) total += 24 * 60; // Handle spanning past midnight
    return total;
  }
  
  return 0;
}

export function formatTimeMMSS(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
