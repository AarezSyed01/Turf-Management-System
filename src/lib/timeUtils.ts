/**
 * Time utility functions for Turf slot and custom time operations
 */

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const trimmed = timeStr.trim();
  
  // Try 12-hour format e.g. "06:30 PM" or "6:30pm" or "12:00 AM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = parseInt(match12[2], 10);
    const period = match12[3]?.toUpperCase();

    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  // Try 24-hour format e.g. "18:30"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const minute = parseInt(match24[2], 10);
    return hour * 60 + minute;
  }

  return 0;
}

export function minutesTo12Hour(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayHourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
  const minuteStr = minute < 10 ? `0${minute}` : `${minute}`;
  
  return `${displayHourStr}:${minuteStr} ${period}`;
}

export function minutesTo24Hour(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
  const minuteStr = minute < 10 ? `0${minute}` : `${minute}`;
  return `${hourStr}:${minuteStr}`;
}

export function time24To12(time24: string): string {
  if (!time24) return '';
  const mins = parseTimeToMinutes(time24);
  return minutesTo12Hour(mins);
}

export function time12To24(time12: string): string {
  if (!time12) return '';
  const mins = parseTimeToMinutes(time12);
  return minutesTo24Hour(mins);
}

export function calculateDurationMinutes(startTime: string, endTime: string): number {
  let start = parseTimeToMinutes(startTime);
  let end = parseTimeToMinutes(endTime);
  
  if (end <= start) {
    // If end is next day or zero
    end += 24 * 60;
  }
  return end - start;
}

export function formatDurationHuman(minutes: number): string {
  if (minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
  return parts.join(' ');
}

export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = parseTimeToMinutes(startA);
  let eA = parseTimeToMinutes(endA);
  if (eA <= sA) eA += 24 * 60;

  const sB = parseTimeToMinutes(startB);
  let eB = parseTimeToMinutes(endB);
  if (eB <= sB) eB += 24 * 60;

  return Math.max(sA, sB) < Math.min(eA, eB);
}
