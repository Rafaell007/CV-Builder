import { Field, ObjectType } from "@nestjs/graphql";

/** The exported PDF of a CV: the file name and the file itself as base64 text. */
@ObjectType()
export class CvPdf {
  /** Made from the CV name, for example `software-engineer.pdf`. */
  @Field()
  fileName!: string;

  /** The bytes of the PDF file, encoded as base64. The client decodes them and saves the file. */
  @Field()
  base64!: string;
}
