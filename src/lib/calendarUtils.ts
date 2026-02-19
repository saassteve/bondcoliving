export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function navigateToPreviousMonth(current: Date): Date {
  return new Date(current.getFullYear(), current.getMonth() - 1, 1);
}

export function navigateToNextMonth(current: Date): Date {
  return new Date(current.getFullYear(), current.getMonth() + 1, 1);
}

export function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getMonthStartDate(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}

export function getMonthEndDate(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
}
