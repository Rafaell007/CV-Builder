import { ArgumentMetadata } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsEmail, IsInt, Max, Min, ValidateNested } from "class-validator";
import { ValidationFailedException } from "../errors";
import { createValidationPipe } from "./create-validation-pipe";

class AddressInput {
  @IsInt()
  @Min(1)
  @Max(10)
  floor!: number;
}

class SignUpInput {
  @IsEmail()
  email!: string;

  @ValidateNested()
  @Type(() => AddressInput)
  address!: AddressInput;
}

describe("global validation pipe", () => {
  const pipe = createValidationPipe();
  // A GraphQL @Args() argument reports as type "body".
  const metadata: ArgumentMetadata = { type: "body", metatype: SignUpInput };

  async function failureOf(value: unknown): Promise<ValidationFailedException> {
    try {
      await pipe.transform(value, metadata);
    } catch (error) {
      if (error instanceof ValidationFailedException) return error;
    }
    throw new Error("Expected a ValidationFailedException");
  }

  it("returns a class instance for valid input", async () => {
    const result: unknown = await pipe.transform(
      { email: "ada@example.com", address: { floor: 3 } },
      metadata,
    );

    expect(result).toBeInstanceOf(SignUpInput);
  });

  it("reports one entry per invalid field", async () => {
    const error = await failureOf({ email: "not-an-email", address: { floor: 3 } });

    expect(error.fieldErrors).toEqual([{ field: "email", messages: ["email must be an email"] }]);
  });

  it("reports nested fields with a dotted path", async () => {
    const error = await failureOf({ email: "ada@example.com", address: { floor: 99 } });

    expect(error.fieldErrors).toEqual([
      { field: "address.floor", messages: ["floor must not be greater than 10"] },
    ]);
  });

  it("reports every invalid field at once", async () => {
    const error = await failureOf({ email: "nope", address: { floor: 0 } });

    expect(error.fieldErrors.map(({ field }) => field)).toEqual(["email", "address.floor"]);
  });

  it("fails loudly on a property that has no validator instead of dropping it", async () => {
    const error = await failureOf({
      email: "ada@example.com",
      address: { floor: 3 },
      nickname: "ada",
    });

    expect(error.fieldErrors).toEqual([
      { field: "nickname", messages: ["property nickname should not exist"] },
    ]);
  });
});
