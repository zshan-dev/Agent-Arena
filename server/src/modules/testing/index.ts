/**
 * Testing Module HTTP Controller.
 *
 * 1 Elysia instance = 1 controller (Elysia MVC pattern).
 * Models registered via .model() and referenced by name.
 * Handlers are thin — delegate to TestingService, then map
 * service results to HTTP responses using Elysia status().
 */

import { Elysia, status, t } from "elysia";
import { TestingService } from "./service";
import type { CreateTestRequest } from "./types";
import {
  CreateTestRequestSchema,
  TestRunSchema,
  TestListResponseSchema,
  ScenarioInfoSchema,
  ScenarioListResponseSchema,
  TestActionLogSchema,
  TestErrorResponseSchema,
  TestSuccessResponseSchema,
} from "./model";

export const testingController = new Elysia({
  name: "Testing.Controller",
  prefix: "/api/tests",
})
  // Register models for OpenAPI documentation and reference by name
  .model({
    "testing.createRequest": CreateTestRequestSchema,
    "testing.testRun": TestRunSchema,
    "testing.testList": TestListResponseSchema,
    "testing.scenarioInfo": ScenarioInfoSchema,
    "testing.scenarioList": ScenarioListResponseSchema,
    "testing.actionLog": TestActionLogSchema,
    "testing.error": TestErrorResponseSchema,
    "testing.success": TestSuccessResponseSchema,
  })

  // -------------------------------------------------------------------------
  // GET /api/tests/scenarios — List available test scenarios
  // -------------------------------------------------------------------------
  .get(
    "/scenarios",
    () => {
      const result = TestingService.getScenarios();

      if (!result.ok) {
        return status(500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      const scenarios = result.data.map((s) => ({
        type: s.type,
        name: s.name,
        description: s.description,
        defaultProfiles: s.defaultProfiles,
        defaultDurationSeconds: s.defaultDurationSeconds,
        relevantMetrics: s.relevantMetrics,
      }));

      return { scenarios, count: scenarios.length };
    },
    {
      response: {
        200: "testing.scenarioList",
        500: "testing.error",
      },
      detail: {
        summary: "List Scenarios",
        description:
          "Get all available test scenario definitions with their default configurations.",
        tags: ["Testing"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // POST /api/tests — Create a new test run
  // -------------------------------------------------------------------------
  .post(
    "/",
    async ({ body }) => {
      const result = await TestingService.createTest(body as CreateTestRequest);

      if (!result.ok) {
        return status(result.httpStatus as 400 | 409 | 500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      body: "testing.createRequest",
      response: {
        200: "testing.testRun",
        400: "testing.error",
        409: "testing.error",
        500: "testing.error",
      },
      detail: {
        summary: "Create Test",
        description:
          "Create a new test run with a scenario type and target LLM model. " +
          "Does not start execution — use POST /:id/start after creation.",
        tags: ["Testing"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // GET /api/tests — List all test runs
  // -------------------------------------------------------------------------
  .get(
    "/",
    async ({ query }) => {
      const result = await TestingService.listTests({
        status: query.status,
        scenarioType: query.scenarioType,
      });

      if (!result.ok) {
        return status(500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
        scenarioType: t.Optional(t.String()),
      }),
      response: {
        200: "testing.testList",
        500: "testing.error",
      },
      detail: {
        summary: "List Tests",
        description:
          "Get all test runs with optional status and scenarioType filters.",
        tags: ["Testing"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // GET /api/tests/:id — Get a single test run
  // -------------------------------------------------------------------------
  .get(
    "/:id",
    async ({ params }) => {
      const result = await TestingService.getTest(params.id);

      if (!result.ok) {
        return status(result.httpStatus as 404 | 500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
      response: {
        200: "testing.testRun",
        404: "testing.error",
        500: "testing.error",
      },
      detail: {
        summary: "Get Test",
        description: "Get a single test run by its ID.",
        tags: ["Testing"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // POST /api/tests/:id/start — Start test execution
  // -------------------------------------------------------------------------
  .post(
    "/:id/start",
    async ({ params }) => {
      const result = await TestingService.startTest(params.id);

      if (!result.ok) {
        return status(result.httpStatus as 404 | 409 | 500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
      response: {
        200: "testing.testRun",
        404: "testing.error",
        409: "testing.error",
        500: "testing.error",
      },
      detail: {
        summary: "Start Test",
        description:
          "Begin execution of a previously created test run. " +
          "Spawns agents, creates Discord channels, and starts the orchestration pipeline.",
        tags: ["Testing"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // POST /api/tests/:id/stop — Stop test execution
  // -------------------------------------------------------------------------
  .post(
    "/:id/stop",
    async ({ params }) => {
      const result = await TestingService.stopTest(params.id);

      if (!result.ok) {
        return status(result.httpStatus as 404 | 409 | 500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
      response: {
        200: "testing.testRun",
        404: "testing.error",
        409: "testing.error",
        500: "testing.error",
      },
      detail: {
        summary: "Stop Test",
        description:
          "Manually stop a running test. Terminates all agents, " +
          "disconnects from voice, and marks the test as cancelled.",
        tags: ["Testing"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // DELETE /api/tests/:id — Delete a test run
  // -------------------------------------------------------------------------
  .delete(
    "/:id",
    async ({ params }) => {
      const result = await TestingService.deleteTest(params.id);

      if (!result.ok) {
        return status(result.httpStatus as 404 | 409 | 500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return {
        success: true as const,
        message: result.data.message,
      };
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
      response: {
        200: "testing.success",
        404: "testing.error",
        409: "testing.error",
        500: "testing.error",
      },
      detail: {
        summary: "Delete Test",
        description:
          "Delete a test run. Only allowed for tests that are not currently active.",
        tags: ["Testing"],
      },
    },
  )

  // -------------------------------------------------------------------------
  // GET /api/tests/:id/logs — Get action logs for a test run
  // -------------------------------------------------------------------------
  .get(
    "/:id/logs",
    async ({ params, query }) => {
      const limit = query.limit ? Number(query.limit) : 200;
      const result = await TestingService.getTestLogs(params.id, limit);

      if (!result.ok) {
        return status(result.httpStatus as 404 | 500, {
          success: false as const,
          message: result.message,
          code: result.code,
        });
      }

      return result.data;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          testId: t.String(),
          logs: t.Array(TestActionLogSchema),
          count: t.Number(),
        }),
        404: "testing.error",
        500: "testing.error",
      },
      detail: {
        summary: "Get Test Logs",
        description:
          "Retrieve action logs for a test run. " +
          "Returns Minecraft actions, Discord messages, and LLM decisions.",
        tags: ["Testing"],
      },
    },
  );
