# CV preview

## Open note: Proficiency enum

The file `models/proficiency.enum.ts` registers the Proficiency enum for GraphQL. At this time only the CV preview uses it.

Move the file to a shared place when a second module needs Proficiency. Do not import it from the CV preview module in other modules. The Mastery enum is an example: it lives in `src/modules/skills/models/mastery.enum.ts`.
