import { describe, expect, it } from "vitest";
import {
  isCvProjectDateReason,
  toCvProjectDateReasons,
  toCvProjectDateText,
  type CvProjectDateTexts,
} from "./cvProjectDates.utils";

// The project lasts from 1 January 2026 to 31 December 2026, as local days.
const range = { start: new Date(2026, 0, 1), end: new Date(2026, 11, 31) };

const texts: CvProjectDateTexts = {
  START_OUTSIDE_PROJECT: "start outside",
  END_OUTSIDE_PROJECT: "end outside",
  END_BEFORE_START: "end before start",
};

describe("toCvProjectDateReasons", () => {
  it("gives no reason for dates inside the project", () => {
    expect(
      toCvProjectDateReasons(
        { startDate: new Date(2026, 2, 1), endDate: new Date(2026, 3, 1) },
        range,
      ),
    ).toEqual({ startDate: [], endDate: [] });
  });

  it("gives no reason for an empty end date (Till now)", () => {
    expect(
      toCvProjectDateReasons({ startDate: new Date(2026, 2, 1), endDate: null }, range),
    ).toEqual({ startDate: [], endDate: [] });
  });

  it("names the start date outside the project", () => {
    expect(
      toCvProjectDateReasons({ startDate: new Date(2025, 11, 31), endDate: null }, range),
    ).toEqual({ startDate: ["START_OUTSIDE_PROJECT"], endDate: [] });
  });

  it("names every broken rule of the end date, in the order of the backend", () => {
    expect(
      toCvProjectDateReasons(
        { startDate: new Date(2026, 2, 10), endDate: new Date(2025, 5, 1) },
        range,
      ).endDate,
    ).toEqual(["END_BEFORE_START", "END_OUTSIDE_PROJECT"]);
  });

  it("accepts the same day for both dates", () => {
    const day = new Date(2026, 4, 5);

    expect(toCvProjectDateReasons({ startDate: day, endDate: day }, range).endDate).toEqual([]);
  });

  it("still checks the end against the start when the range of the project is unknown", () => {
    expect(
      toCvProjectDateReasons(
        { startDate: new Date(1990, 0, 1), endDate: new Date(1989, 0, 1) },
        undefined,
      ),
    ).toEqual({ startDate: [], endDate: ["END_BEFORE_START"] });
  });

  describe("near midnight (whole calendar days)", () => {
    it("accepts the last minute of the last day of the project", () => {
      expect(
        toCvProjectDateReasons({ startDate: new Date(2026, 11, 31, 23, 59), endDate: null }, range)
          .startDate,
      ).toEqual([]);
    });

    it("refuses the first minute after the project", () => {
      expect(
        toCvProjectDateReasons({ startDate: new Date(2027, 0, 1, 0, 1), endDate: null }, range)
          .startDate,
      ).toEqual(["START_OUTSIDE_PROJECT"]);
    });

    it("accepts an end date earlier in the day than the start date on the same day", () => {
      expect(
        toCvProjectDateReasons(
          { startDate: new Date(2026, 4, 5, 23, 59), endDate: new Date(2026, 4, 5, 0, 1) },
          range,
        ).endDate,
      ).toEqual([]);
    });
  });
});

describe("isCvProjectDateReason", () => {
  it("knows the three codes of the backend and no other", () => {
    expect(
      ["START_OUTSIDE_PROJECT", "END_OUTSIDE_PROJECT", "END_BEFORE_START"].every(
        isCvProjectDateReason,
      ),
    ).toBe(true);
    expect(isCvProjectDateReason("SOMETHING_NEW")).toBe(false);
  });
});

describe("toCvProjectDateText", () => {
  it("gives the text of one reason", () => {
    expect(toCvProjectDateText(["END_OUTSIDE_PROJECT"], texts)).toBe("end outside");
  });

  it("gives the text of every reason, in order", () => {
    expect(toCvProjectDateText(["END_BEFORE_START", "END_OUTSIDE_PROJECT"], texts)).toBe(
      "end before start. end outside",
    );
  });

  it("skips a reason it does not know", () => {
    expect(toCvProjectDateText(["SOMETHING_NEW", "END_BEFORE_START"], texts)).toBe(
      "end before start",
    );
  });

  it("gives undefined when no reason is known, so the caller shows its general text", () => {
    expect(toCvProjectDateText(["SOMETHING_NEW"], texts)).toBeUndefined();
    expect(toCvProjectDateText([], texts)).toBeUndefined();
  });
});
