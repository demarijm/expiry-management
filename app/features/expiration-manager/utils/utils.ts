import { format, formatDistanceToNowStrict, isValid, subDays } from "date-fns";

export function convertDaysToDate(days: number, date: Date) {
  const d = subDays(date, days);
  return format(d, "yyyy-MM-dd");
}

export function expirationDateInWords(date: Date) {
  if (isValid(date)) {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
  return "";
}

export function warningDateInWords(warningDate: Date, expirationDate: Date) {
  if (isValid(warningDate) && isValid(expirationDate)) {
    const expiryBefore = subDays(expirationDate, 1);
    return `Will alert from ${format(warningDate, "PP")} to ${format(expiryBefore, "PP")}`;
  }
  return "";
}

export function getExpirationDateStatus(expirationDateStatus: any): boolean {
  if (!expirationDateStatus) return false;

  if (expirationDateStatus?.value === "true") {
    return true;
  } else if (expirationDateStatus?.value === "false") {
    return false;
  } else {
    return false;
  }
}
