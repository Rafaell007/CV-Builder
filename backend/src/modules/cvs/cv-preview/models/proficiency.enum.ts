import { registerEnumType } from "@nestjs/graphql";
import { Proficiency } from "../../../../generated/prisma/enums";

// Makes the Prisma enum part of the GraphQL schema. Registered here because the CV preview is the
// first GraphQL type that uses it. Other modules that need it import it from this file.
registerEnumType(Proficiency, { name: "Proficiency" });

export { Proficiency };
