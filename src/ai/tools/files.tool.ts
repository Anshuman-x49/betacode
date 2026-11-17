import { tool } from "langchain";
import fs from "fs/promises";
import path from "path";
import z from "zod";

// Tool for creating or updating multiple files in one operation.
export const upsertFilesTool = tool(
  async function ({ files }: { files: { path: string; content: string }[] }) {
    // Write each file concurrently to speed up batch updates.
    await Promise.all(
      files.map(async (file) => {
        return await fs.writeFile(file.path, file.content);
      }),
    );
  },
  {
    name: "upsertFiles",
    description:
      "Create/Update multiple files at once (Create only if it doesn't exist)",
    schema: z.object({
      files: z.array(
        z.object({
          path: z
            .string()
            .describe("Absolute path of the file to create/update"),
          content: z
            .string()
            .describe("Content of the file to be create/update"),
        }),
      ),
    }),
  },
);

export const listFilesTool = tool(
  async function ({ folder }: { folder: string }) {
    const results: string[] = [];
    async function traverse(currentFolder: string) {
      const entries = await fs.readdir(currentFolder, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentFolder, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === ".git") continue;
          await traverse(fullPath);
        } else {
          results.push(fullPath);
        }
      }
    }
    await traverse(folder);
    return results;
  },
  {
    name: "listFiles",
    description:
      "Recursively list all file paths in a folder (skips node_modules and .git)",
    schema: z.object({
      folder: z.string().describe("Path of the folder to list files from"),
    }),
  },
);

export const readFilesTool = tool(
  async function ({ files }: { files: { path: string }[] }) {
    const results = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(file.path, "utf-8");
        return { path: file.path, content };
      }),
    );
    return results;
  },
  {
    name: "readFiles",
    description: "Read multiple files",
    schema: z.object({
      files: z.array(
        z.object({
          path: z.string().describe("Absolute path of the file to read"),
        }),
      ),
    }),
  },
);
