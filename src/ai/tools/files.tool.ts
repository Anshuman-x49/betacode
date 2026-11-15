import { tool } from "langchain";
import fs from "fs/promises";
import z from "zod";

export const upsertFilesTool = tool(
  async function ({ files }: { files: { path: string; content: string }[] }) {
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
