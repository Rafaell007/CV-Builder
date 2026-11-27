import { registerEnumType } from "@nestjs/graphql";
import { Mastery } from "../../../generated/prisma/enums";

// Makes the Prisma enum part of the GraphQL schema without exposing Prisma types in resolvers.
// Shared by the skills of a CV and the skills of a user.
registerEnumType(Mastery, { name: "Mastery" });

export { Mastery };
