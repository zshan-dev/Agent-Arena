/**
 * Testing Repository
 *
 * Data access layer for test runs and action logs using in-memory Maps.
 * Same pattern as agents/repository.ts -- Prisma-ready interface.
 * TODO: Replace with actual Prisma client once schema is migrated.
 */

import type { TestRun, TestActionLog } from "./types";

// ---------------------------------------------------------------------------
// In-memory storage
// ---------------------------------------------------------------------------

const testRunsStore = new Map<string, TestRun>();
const actionLogsStore = new Map<string, TestActionLog[]>();

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class TestingRepository {
  /**
   * Create a new test run.
   */
  static async create(testRun: TestRun): Promise<TestRun> {
    testRunsStore.set(testRun.testId, testRun);
    actionLogsStore.set(testRun.testId, []);
    return testRun;
  }

  /**
   * Find a test run by ID.
   */
  static async findById(testId: string): Promise<TestRun | null> {
    return testRunsStore.get(testId) ?? null;
  }

  /**
   * Find all test runs with optional filters.
   */
  static async findAll(filters?: {
    status?: string;
    scenarioType?: string;
  }): Promise<TestRun[]> {
    let runs = Array.from(testRunsStore.values());

    if (filters?.status) {
      runs = runs.filter((r) => r.status === filters.status);
    }

    if (filters?.scenarioType) {
      runs = runs.filter((r) => r.scenarioType === filters.scenarioType);
    }

    return runs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Update a test run's data.
   */
  static async update(
    testId: string,
    data: Partial<TestRun>
  ): Promise<void> {
    const testRun = testRunsStore.get(testId);
    if (!testRun) {
      throw new Error(`Test run ${testId} not found`);
    }

    const updated = { ...testRun, ...data };
    testRunsStore.set(testId, updated);
  }

  /**
   * Delete a test run and its action logs.
   */
  static async delete(testId: string): Promise<boolean> {
    const existed = testRunsStore.has(testId);
    testRunsStore.delete(testId);
    actionLogsStore.delete(testId);
    return existed;
  }

  /**
   * Create an action log entry for a test run.
   */
  static async createActionLog(log: TestActionLog): Promise<void> {
    const logs = actionLogsStore.get(log.testId) ?? [];
    logs.push(log);
    actionLogsStore.set(log.testId, logs);
  }

  /**
   * Find action logs for a test run.
   */
  static async findActionLogs(
    testId: string,
    limit: number = 200
  ): Promise<TestActionLog[]> {
    const logs = actionLogsStore.get(testId) ?? [];
    return logs
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  }

  /**
   * Count test runs with optional filters.
   */
  static async count(filters?: {
    status?: string;
    scenarioType?: string;
  }): Promise<number> {
    const runs = await this.findAll(filters);
    return runs.length;
  }

  /**
   * Check if a test run exists.
   */
  static async exists(testId: string): Promise<boolean> {
    return testRunsStore.has(testId);
  }

  /**
   * Count currently active test runs (initializing, coordination, executing).
   */
  static async countActive(): Promise<number> {
    let count = 0;
    for (const run of testRunsStore.values()) {
      if (
        run.status === "initializing" ||
        run.status === "coordination" ||
        run.status === "executing"
      ) {
        count++;
      }
    }
    return count;
  }
}
