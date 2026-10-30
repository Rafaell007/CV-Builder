/**
 * The source of "now" for business rules (token expiry, CV dates, ...).
 * An abstract class, because it doubles as the Nest injection token; tests swap it for a fixed time.
 */
export abstract class Clock {
  abstract now(): Date;
}
