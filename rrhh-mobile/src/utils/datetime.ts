import { format, isToday, parseISO } from "date-fns";

export const formatHour = (time?: string | null): string => {
  if (!time) return "--:--";
  return time.slice(0, 5);
};

export const formatDateLabel = (date: string): string => {
  const parsed = parseISO(date);
  return isToday(parsed) ? "Hoy" : format(parsed, "dd MMM yyyy");
};
