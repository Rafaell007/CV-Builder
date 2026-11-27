-- Prisma cannot express CHECK constraints in the schema, so this migration is written by hand.

-- A project cannot end before it starts (page 27).
ALTER TABLE "Project" ADD CONSTRAINT "Project_dates_check" CHECK ("startDate" <= "endDate");

-- The same for a project inside a CV; an empty end date means "Present".
ALTER TABLE "CvProject" ADD CONSTRAINT "CvProject_dates_check" CHECK ("endDate" IS NULL OR "startDate" <= "endDate");
