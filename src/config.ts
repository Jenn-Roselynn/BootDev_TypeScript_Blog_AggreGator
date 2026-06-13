import fs from "fs";
import os from "os";
import path from "path";

export interface Config {
  dbUrl: string;
  currentUserName?: string;
}

const CONFIG_FILE_NAME = ".gatorconfig.json";

function getConfigFilePath(): string {
  return path.join(os.homedir(), CONFIG_FILE_NAME);
}

function writeConfig(cfg: Config): void {
  const filePath = getConfigFilePath();
  const rawData = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };
  fs.writeFileSync(filePath, JSON.stringify(rawData, null, 2), "utf-8");
}

export function readConfig(): Config {
  const filePath = getConfigFilePath();
  if (!fs.existsSync(filePath)) {
    throw new Error(`Configuration file not found at: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const parsedData = JSON.parse(fileContent);
  return validateConfig(parsedData);
}

export function setUser(username: string): void {
  let currentConfig: Config;
  try {
    currentConfig = readConfig();
  } catch (error) {
    currentConfig = { dbUrl: "" };
  }

  currentConfig.currentUserName = username;
  writeConfig(currentConfig);
}

function validateConfig(rawConfig: any): Config {
  if (!rawConfig || typeof rawConfig !== "object") {
    throw new Error("Invalid configuration file structure.");
  }

  if (typeof rawConfig.db_url !== "string") {
    throw new Error("Configuration is missing a valid 'db_url' string field.");
  }

  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };
}