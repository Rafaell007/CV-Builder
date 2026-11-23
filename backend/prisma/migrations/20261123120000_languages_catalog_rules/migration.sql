-- Written by hand: Prisma's generated SQL drops and re-adds the column, which would lose the names.
-- citext compares text without regard to letter case, so the unique index, equality and sort
-- treat "English" and "english" as the same language (D35). The data and the index are kept.
-- The citext extension was created by 20261117154613_case_insensitive_catalog_names.ALTER TABLE "Language" ALTER COLUMN "name" TYPE CITEXT;

-- citext has no length, so the old VARCHAR(100) limit becomes a CHECK (Prisma cannot express it).
ALTER TABLE "Language" ADD CONSTRAINT "Language_name_length_check" CHECK (char_length("name") <= 100);

-- ISO codes are stored uppercase (page 19). Existing rows are converted first, then a CHECK keeps
-- them uppercase, so the plain unique index on "iso" also rejects "en" next to "EN".
UPDATE "Language" SET "iso" = upper("iso") WHERE "iso" <> upper("iso");
ALTER TABLE "Language" ADD CONSTRAINT "Language_iso_uppercase_check" CHECK ("iso" = upper("iso"));
