import { StateGraph, START, END } from "@langchain/langgraph";
import z from "zod";
import { LLMNode } from "./node.js";
import rl from "../../utils/readline.util.js";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

// Define the graph state: a list of conversation messages.
const state = z.object({
  messages: z.array(z.any()),
});

const systemPrompt = `You are a senior software engineer and coding assistant. Follow the Ponytail protocol:
- Prefer the smallest complete fix over speculative or over-engineered solutions.
- Reuse existing code patterns, libraries, and project conventions before adding new abstractions or dependencies.
- Fix the root cause within the current scope and avoid unrelated cleanup.
- Do not compromise security, correctness, validation, or data-integrity safeguards.
- Keep responses practical, concise, and implementation-focused.
- Explain trade-offs briefly when a shortcut or limitation is necessary.
- Maintain a clear separation between problem-solving, code changes, and validation.
- This is the absolute path ${process.cwd()}`;

// Build the workflow: start -> LLM node -> end.
const graph = new StateGraph(state)
  .addNode("LLMNode", LLMNode)
  .addEdge(START, "LLMNode")
  .addEdge("LLMNode", END)
  .compile();

/**
 * Starts the interactive conversation loop.
 * Reads each user prompt, runs it through the graph, and prints the AI response.
 */
export async function initGraph() {
  let messages: BaseMessage[] = [new SystemMessage(systemPrompt)];
  while (true) {
    // Read one line of user input from the terminal.
    const userInput = await new Promise<string>((resolve) =>
      rl.question("[User]: ", resolve),
    );

    if (
      userInput.toLowerCase() === "/bye" ||
      userInput.toLowerCase() === "/exit"
    ) {
      break;
    }

    // Add the user's message to the conversation history.
    messages.push(new HumanMessage(userInput));

    // Send the input through the graph so the LLM node can generate a response.
    const response = await graph.invoke({ messages });

    // Keep the full conversation history for the next turn.
    messages = response.messages;
  }
}
