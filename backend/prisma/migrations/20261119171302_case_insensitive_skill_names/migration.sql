-- Written by hand: Prisma's generated SQL drops and re-adds the column, which would lose the names.
-- citext compares text without regard to letter case, so the unique index, equality and sort
-- treat "React" and "react" as the same skill (D35). The data and the index are kept.
-- The citext extension was created by 20261117154613_case_insensitive_catalog_names.
ALTER TABLE "Skill" ALTER COLUMN "name" TYPE CITEXT;

-- citext has no length, so the old VARCHAR(100) limit becomes a CHECK (Prisma cannot express it).
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_name_length_check" CHECK (char_length("name") <= 100);
