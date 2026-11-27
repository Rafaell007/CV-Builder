import { registerEnumType } from "@nestjs/graphql";
import { Role } from "../../../generated/prisma/enums";

// Makes the Prisma enum part of the GraphQL schema without exposing Prisma types in resolvers.
registerEnumType(Role, { name: "Role" });

export { Role };
