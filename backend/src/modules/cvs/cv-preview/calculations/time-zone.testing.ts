const OFFSET_MS = -11 * 60 * 60 * 1000;

/** The same moment as seen in the time zone UTC-11, read with the UTC getters. */
function shifted(date: Date): Date {
  return new Date(date.getTime() + OFFSET_MS);
}

/**
 * Test helper: runs `run` while the local-time getters of `Date` answer as in the time zone UTC-11.
 * A dev machine or a server in UTC cannot tell `getUTCMonth` from `getMonth`. With this helper a calculation
 * that reads local time gives another answer, so the test fails. The getters are restored afterwards.
 */
export function inTimeZoneUtcMinus11<T>(run: () => T): T {
  const { getFullYear, getMonth, getDate } = Date.prototype;
  Date.prototype.getFullYear = function (this: Date) {
    return shifted(this).getUTCFullYear();
  };
  Date.prototype.getMonth = function (this: Date) {
    return shifted(this).getUTCMonth();
  };
  Date.prototype.getDate = function (this: Date) {
    return shifted(this).getUTCDate();
  };
  try {
    return run();
  } finally {
    Date.prototype.getFullYear = getFullYear;
    Date.prototype.getMonth = getMonth;
    Date.prototype.getDate = getDate;
  }
}
