/**
 * LLM Elysia controller.
 *
 * 1 Elysia instance = 1 controller (MVC pattern from Elysia skill).
 * Models registered via .model() and referenced by name.
 * Handlers are thin — delegate to LlmService.
 *
 * Streaming uses the Vercel AI SDK integration pattern:
 *   return stream.textStream   (ReadableStream — Elysia auto-handles)
 *
 * See: .agents/skills/elysiajs/integrations/ai-sdk.md
 */

import { Elysia, status } from "elysia";
import { LlmService } from "./service";
import { DEFAULT_LLM_MODEL } from "../../../constants/llm.constants";
import {
  ChatBody,
  ChatResponse,
  LlmErrorResponse,
  LlmStatusResponse,
} from "./model";

export const llmController = new Elysia({
  name: "Llm.Controller",
  prefix: "/api/llm",
})
  // Register models for OpenAPI + reference by name
  .model({
    "llm.chatBody": ChatBody,
    "llm.chatResponse": ChatResponse,
    "llm.error": LlmErrorResponse,
    "llm.status": LlmStatusResponse,
  })

  // ---------------------------------------------------------------------------
  // GET /api/llm/status — Check if OpenRouter is configured
  // ---------------------------------------------------------------------------
  .get(
    "/status",
    () => {
      return {
        configured: LlmService.isConfigured(),
        defaultModel: DEFAULT_LLM_MODEL,
      };
    },
    {
      response: {
        200: "llm.status",
      },
      detail: {
        summary: "LLM Status",
        description:
          "Check whether OpenRouter is configured and the default model.",
        tags: ["LLM"],
      },
    },
  )

  // ---------------------------------------------------------------------------
  // POST /api/llm/chat — Non-streaming chat completion
  // ---------------------------------------------------------------------------
  .post(
    "/chat",
    async ({ body }) => {
      const result = await LlmService.chat(body);

      if (!result.ok) {
        return status(502, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      body: "llm.chatBody",
      response: {
        200: "llm.chatResponse",
        502: "llm.error",
      },
      detail: {
        summary: "Chat Completion",
        description:
          "Send messages and receive a complete LLM response (non-streaming). Pass any OpenRouter model ID.",
        tags: ["LLM"],
      },
    },
  )

  // ---------------------------------------------------------------------------
  // POST /api/llm/chat/stream — Streaming chat completion
  // ---------------------------------------------------------------------------
  .post(
    "/chat/stream",
    ({ body }) => {
      const result = LlmService.streamChat(body);

      if (!result.ok) {
        return status(502, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      // Return the ReadableStream — Elysia auto-handles streaming
      return result.stream.textStream;
    },
    {
      body: "llm.chatBody",
      detail: {
        summary: "Stream Chat Completion",
        description:
          "Send messages and receive a streaming LLM response. Pass any OpenRouter model ID.",
        tags: ["LLM"],
      },
    },
  );
