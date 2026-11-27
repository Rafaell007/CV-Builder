import type { PositionsQuery } from "@/shared/graphql";

/** One row of the positions list, as the `Positions` query returns it. */
export type PositionListItem = PositionsQuery["positions"]["items"][number];
