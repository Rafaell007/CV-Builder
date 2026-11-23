import { escapeLike } from "./escape-like";

describe("escapeLike", () => {
  it.each([
    ["%", "\\%"],
    ["_", "\\_"],
    ["\\", "\\\\"],
    ["100%_done\\", "100\\%\\_done\\\\"],
    ["plain text", "plain text"],
    ["", ""],
  ])("turns %j into %j", (input, expected) => {
    expect(escapeLike(input)).toBe(expected);
  });
});
