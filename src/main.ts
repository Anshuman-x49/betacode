import { initGraph } from "./graph/graph.js";
import { getApiKey, getSettingsFile, saveApiKey } from "./utils/file.util.js";
import rl from "./utils/readline.util.js";

async function userApiKey() {
  const apiKey = await new Promise<string>((resolve) =>
    rl.question("Please enter your API key : ", resolve),
  );
  await saveApiKey({ apiKey });
}

// Entry point for the app startup flow.
// It checks whether an API key already exists, prompts the user if needed,
// and validates the key before continuing.
async function main() {
  // Load saved settings from disk to see if a key already exists.
  const settings = await getSettingsFile();

  // If there is no saved API key, ask the user to enter one and store it.
  if (!settings.apiKey) {
    await userApiKey();
  }

  // Validate the API key by checking it against the provider.
  const response = await getApiKey();

  // Stop startup if the key is missing or invalid.
  if (!response || response.error) {
    console.error(response?.error ?? "Failed to retrieve API key.");
    await userApiKey();
    return main();
  }

  // Start the graph only after the API key has been validated.
  await initGraph();
  rl.close();
}

export default main;
