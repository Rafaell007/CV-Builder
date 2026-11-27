import { registerEnumType } from "@nestjs/graphql";
import { Proficiency } from "../../../../generated/prisma/enums";

// Makes the Prisma enum part of the GraphQL schema. Registered here because the CV preview is the
// first GraphQL type that uses it. If a second module needs it, move this file to a shared place first. See README.md in the parent folder.
registerEnumType(Proficiency, { name: "Proficiency" });

export { Proficiency };
