const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
} else {
  dotenv.config();
}

const directUrl = process.env.DIRECT_DATABASE_URL;
const shouldForceMigrate = process.env.VERCEL === "1" || process.env.USE_DIRECT_DATABASE_URL === "true";

if (!shouldForceMigrate) {
  console.log("Skipping Prisma migrations (set USE_DIRECT_DATABASE_URL=true to run locally).");
  process.exit(0);
}

if (directUrl) {
  console.log("Using DIRECT_DATABASE_URL for Prisma migrations");
  process.env.DATABASE_URL = directUrl;
} else {
  console.warn("DIRECT_DATABASE_URL not set. Falling back to DATABASE_URL for migrations.");
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error("Failed to run prisma migrate deploy:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
