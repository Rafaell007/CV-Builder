import { Field, InputType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";
import { NormalizeSpaces, Trim } from "../../../common/validation";

@InputType()
export class CreateLanguageInput {
  @Field()
  @NormalizeSpaces()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  /**
   * Trimmed, and only the letters a-z uppercased: `toUpperCase()` would turn "ß" into "SS" and let it
   * pass the letter check. The database CHECKs keep it uppercase and at most 5 characters.
   */
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string"
      ? value.trim().replace(/[a-z]/g, (letter) => letter.toUpperCase())
      : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  @Matches(/^[A-Z]+(-[A-Z]+)?$/, {
    message: "iso must contain only the letters A-Z and one optional hyphen",
  })
  iso!: string;

  @Field()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nativeName!: string;
}
