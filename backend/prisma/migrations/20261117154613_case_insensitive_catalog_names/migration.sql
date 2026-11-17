-- Written by hand: Prisma's generated SQL drops and re-adds the column, which would lose the names.
-- citext compares text without regard to letter case, so the unique index, equality and sort
-- treat "Engineering" and "engineering" as the same name (D35). The data and the index are kept.
CREATE EXTENSION IF NOT EXISTS citext;

ALTER TABLE "Department" ALTER COLUMN "name" TYPE CITEXT;
ALTER TABLE "Position" ALTER COLUMN "name" TYPE CITEXT;

-- citext has no length, so the old VARCHAR(100) limit becomes a CHECK (Prisma cannot express it).
ALTER TABLE "Department" ADD CONSTRAINT "Department_name_length_check" CHECK (char_length("name") <= 100);
ALTER TABLE "Position" ADD CONSTRAINT "Position_name_length_check" CHECK (char_length("name") <= 100);
