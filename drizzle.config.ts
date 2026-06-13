import { defineConfig } from "drizzle-kit";
import fs from "fs";
import os from "os";
import path from "path";

const configPath = path.join(os.homedir(), ".gatorconfig.json");

if (!fs.existsSync(configPath)) {
  throw new Error(`Migration engine could not locate the configuration block at: ${configPath}`);
}

const rawContent = fs.readFileSync(configPath, "utf-8");
const parsedJson = JSON.parse(rawContent);
const dbUrl = parsedJson.db_url;

if (typeof dbUrl !== "string") {
  throw new Error("Migration engine parsed the config file but found no valid 'db_url' string property.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});