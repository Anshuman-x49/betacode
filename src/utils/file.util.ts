import fs from "fs/promises";
import path from "path";
import { HOME_DIR, CONFIG_DIR } from "./constant.util.js";
import axios from "axios";

// File helpers for reading and writing app settings stored in the config directory.

/**
 * Ensures the config directory exists and returns the saved settings JSON.
 * If the settings file is missing or invalid, it creates a new empty settings object.
 */
export async function getSettingsFile() {
  // Make sure the config directory exists before trying to read or write settings.
  try {
    await fs.access(CONFIG_DIR);
  } catch (error) {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  }

  // Store settings in the app config folder as a JSON file.
  const settingFilePath = path.join(CONFIG_DIR, "settings.json");

  try {
    // If the settings file already exists, read and parse it.
    await fs.access(settingFilePath);
    const content = await fs.readFile(settingFilePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    // If the file is missing or invalid, reset it to an empty object.
    await fs.writeFile(settingFilePath, JSON.stringify({}));
    return {};
  }
}

/**
 * Saves the provided API key into the app settings file.
 * It loads the current settings, adds the new key, and writes the updated JSON back.
 */
export async function saveApiKey({ apiKey }: { apiKey: String }) {
  // Read the current settings so the new value can be merged into the existing data.
  const settingsContent = await getSettingsFile();

  // Write the updated settings object back to the file.
  const settingFilePath = path.join(CONFIG_DIR, "settings.json");
  await fs.writeFile(
    settingFilePath,
    JSON.stringify({
      ...settingsContent,
      apiKey,
    }),
  );
}

/**
 * Reads the saved API key from settings.
 * Returns null if no key has been stored yet.
 */
export async function getApiKey() {
  // Load the settings and return the stored API key if present.
  const settings = await getSettingsFile();
  const apiKey = settings.apiKey || null;

  // If no key exists, return an error response instead of continuing.
  if (!apiKey) {
    return {
      error: "API key not found in settings file",
    };
  }

  try {
    // Verify the key by making a lightweight request to the Groq API.
    await axios.get("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // The key is valid, so return it for use elsewhere in the app.
    return {
      apiKey,
    };
  } catch (error) {
    // A 401 means the API key is invalid or expired.
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof error.response === "object" &&
      error.response !== null &&
      "status" in error.response &&
      error.response.status === 401
    ) {
      return {
        error: "Invalid or Expired API key",
      };
    }
  }
}
