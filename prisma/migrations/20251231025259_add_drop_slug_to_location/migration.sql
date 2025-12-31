/*
  Warnings:

  - A unique constraint covering the columns `[dropSlug]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dropSlug` to the `Location` table without a default value. This is not possible if the table is not empty.

*/

-- First, add the column as nullable
ALTER TABLE "Location" ADD COLUMN "dropSlug" TEXT;

-- Then populate existing rows by converting their names to slugs with unique suffix if needed
DO $$
DECLARE
    rec RECORD;
    base_slug TEXT;
    final_slug TEXT;
    counter INT;
BEGIN
    FOR rec IN SELECT id, name FROM "Location" ORDER BY id
    LOOP
        base_slug := LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    TRIM(rec.name),
                    '\s+', '-', 'g'
                ),
                '[^a-z0-9-]', '', 'g'
            )
        );
        
        final_slug := base_slug;
        counter := 1;
        
        -- Check for duplicates and append number if needed
        WHILE EXISTS (SELECT 1 FROM "Location" WHERE "dropSlug" = final_slug AND id != rec.id) LOOP
            final_slug := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;
        
        UPDATE "Location" SET "dropSlug" = final_slug WHERE id = rec.id;
    END LOOP;
END $$;

-- Make the column non-nullable
ALTER TABLE "Location" ALTER COLUMN "dropSlug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Location_dropSlug_key" ON "Location"("dropSlug");
