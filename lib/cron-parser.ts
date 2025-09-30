/**
 * Converts cron expressions to colloquial terms
 */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function cronToColloquial(cronSchedule: string): string {
  // Handle common macros first
  const macroMap: Record<string, string> = {
    '@yearly': 'Yearly',
    '@annually': 'Yearly',
    '@monthly': 'Monthly',
    '@weekly': 'Weekly',
    '@daily': 'Daily',
    '@midnight': 'Daily',
    '@hourly': 'Hourly',
    '@weekday': 'Weekdays',
    'daily': 'Daily',
    'weekly': 'Weekly',
    'monthly': 'Monthly'
  };

  const lower = cronSchedule.trim().toLowerCase();
  if (macroMap[lower]) {
    return macroMap[lower];
  }

  // Parse standard cron format: minute hour dayOfMonth month dayOfWeek
  const parts = cronSchedule.trim().split(/\s+/).filter(Boolean);
  
  // Handle 6-field cron (with seconds) by ignoring the first field
  const fields = parts.length === 6 ? parts.slice(1) : parts;
  
  if (fields.length !== 5) {
    return cronSchedule; // Return original if we can't parse it
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

  // Check if this is a daily schedule with specific days of the week
  if (minute === '0' && hour === '1' && dayOfMonth === '*' && month === '*') {
    return parseDayOfWeek(dayOfWeek);
  }

  // For other patterns, return a more generic description
  if (minute === '0' && hour === '1' && dayOfMonth === '*' && month === '*') {
    return 'Daily';
  }

  return cronSchedule; // Return original if we can't parse it
}

function parseDayOfWeek(dayOfWeek: string): string {
  if (dayOfWeek === '*') {
    return 'Daily';
  }

  // Handle ranges and lists
  const days = parseDayList(dayOfWeek);
  
  if (days.length === 0) {
    return dayOfWeek; // Return original if we can't parse
  }

  // Check for common patterns
  if (isWeekdays(days)) {
    return 'Weekdays';
  }
  
  if (isWeekends(days)) {
    return 'Weekends';
  }

  // For irregular selections, return 3-letter abbreviations
  const dayNames = days.map(day => DAY_NAMES[day]).join(', ');
  return dayNames;
}

function parseDayList(dayOfWeek: string): number[] {
  const days: number[] = [];
  
  // Split by comma to handle lists
  const parts = dayOfWeek.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    
    if (trimmed.includes('-')) {
      // Handle ranges like "1-5"
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          days.push(i % 7); // Ensure it's 0-6
        }
      }
    } else {
      // Handle single numbers
      const num = parseInt(trimmed);
      if (!isNaN(num)) {
        days.push(num % 7); // Ensure it's 0-6
      }
    }
  }
  
  // Remove duplicates and sort
  return [...new Set(days)].sort((a, b) => a - b);
}

function isWeekdays(days: number[]): boolean {
  // Check if days contains exactly Monday through Friday (1-5)
  const weekdays = [1, 2, 3, 4, 5];
  return days.length === 5 && weekdays.every(day => days.includes(day));
}

function isWeekends(days: number[]): boolean {
  // Check if days contains exactly Saturday and Sunday (0, 6)
  const weekends = [0, 6];
  return days.length === 2 && weekends.every(day => days.includes(day));
}
