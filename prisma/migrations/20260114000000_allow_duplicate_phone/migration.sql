-- Drop unique constraint on phone to allow same number across roles
DROP INDEX IF EXISTS "User_phone_key";

-- Optional: add non-unique index for faster lookup
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");
