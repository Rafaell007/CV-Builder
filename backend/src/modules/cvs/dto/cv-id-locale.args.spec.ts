import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CvIdLocaleArgs } from "./cv-id-locale.args";

const CV_ID = "3f2b8c1e-6a4d-4e0b-9a57-2d1c8b7e5f40";

async function parse(plain: Record<string, unknown>) {
  const args = plainToInstance(CvIdLocaleArgs, plain);
  return { args, errors: await validate(args) };
}

describe("CvIdLocaleArgs", () => {
  it("uses English when the language is missing", async () => {
    const { args, errors } = await parse({ cvId: CV_ID });

    expect(errors).toEqual([]);
    expect(args.locale).toBe("en");
  });

  it("uses English when the language is null", async () => {
    const { args, errors } = await parse({ cvId: CV_ID, locale: null });

    expect(errors).toEqual([]);
    expect(args.locale).toBe("en");
  });

  it("keeps a language that is allowed", async () => {
    const { args, errors } = await parse({ cvId: CV_ID, locale: "pl" });

    expect(errors).toEqual([]);
    expect(args.locale).toBe("pl");
  });

  it("refuses a language that is not allowed", async () => {
    const { errors } = await parse({ cvId: CV_ID, locale: "de" });

    expect(errors.map((error) => error.property)).toEqual(["locale"]);
  });

  it("refuses an id that is not a UUID", async () => {
    const { errors } = await parse({ cvId: "cv-1" });

    expect(errors.map((error) => error.property)).toEqual(["cvId"]);
  });
});
