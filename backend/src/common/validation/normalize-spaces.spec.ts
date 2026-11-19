import { plainToInstance } from "class-transformer";
import { NormalizeSpaces } from "./normalize-spaces";

class NameInput {
  @NormalizeSpaces()
  name!: unknown;
}

const normalize = (name: unknown): unknown => plainToInstance(NameInput, { name }).name;

describe("NormalizeSpaces", () => {
  it("trims and turns each run of whitespace inside into one space", () => {
    expect(normalize("  Human \t Resources\n ")).toBe("Human Resources");
  });

  it("leaves a name that is already normal unchanged", () => {
    expect(normalize("Human Resources")).toBe("Human Resources");
  });

  it("turns a value of only spaces into an empty string", () => {
    expect(normalize("   ")).toBe("");
  });

  it("passes other types through", () => {
    expect(normalize(42)).toBe(42);
  });
});
