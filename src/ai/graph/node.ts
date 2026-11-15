import { ChatGroq } from "@langchain/groq";
import { getApiKey } from "../../utils/file.util.js";
import { AIMessage, BaseMessage } from "@langchain/core/messages";

// The state passed into the LLM node contains a conversation history of messages.
interface stateFormat {
  messages: BaseMessage[];
}

/**
 * Runs the Groq-backed language model for the current message history.
 * Reads the stored API key, streams the model response, and appends the AI reply.
 */
export async function LLMNode(state: stateFormat) {
  // Load the validated API key before creating the model client.
  const keyResult = await getApiKey();
  if (!keyResult || "error" in keyResult) {
    throw new Error(keyResult?.error ?? "API key not found");
  }

  // Create the Groq model instance using the configured API key.
  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: keyResult.apiKey,
    temperature: 0.7,
  });

  // Stream the model output from the current conversation.
  const stream = await model.stream(state.messages);

  process.stdout.write("[AI]: ");
  // Collect the streamed text into one AI message.
  let aiMessage = "";
  for await (const chunk of stream) {
    process.stdout.write(String(chunk.content));
    aiMessage += String(chunk.content);
  }

  process.stdout.write("\n");

  // Return the updated message history including the AI response.
  return {
    messages: [...state.messages, new AIMessage(aiMessage)],
  };
}
