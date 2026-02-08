/**
 * Evaluation Repository
 *
 * Data access layer for metrics and reports.
 * Currently uses in-memory storage. Can be upgraded to Prisma for persistence.
 *
 * Following ElysiaJS best practices: Abstract class with static methods
 */

import type { BaseMetric, EvaluationReport } from "./model";

/**
 * In-memory repository for evaluation data
 *
 * TODO: Replace with Prisma repository for database persistence
 * when USE_DATABASE=true
 */
export abstract class EvaluationRepository {
  private static metrics: BaseMetric[] = [];
  private static reports: EvaluationReport[] = [];

  /**
   * Save a single metric
   */
  static async saveMetric(metric: BaseMetric): Promise<void> {
    this.metrics.push(metric);
    console.log(`[EvaluationRepository] Saved metric: ${metric.metricType} for ${metric.agentId}`);
  }

  /**
   * Save multiple metrics in batch
   */
  static async saveMetrics(metrics: BaseMetric[]): Promise<void> {
    this.metrics.push(...metrics);
    console.log(`[EvaluationRepository] Saved ${metrics.length} metrics`);
  }

  /**
   * Get all metrics for a test run
   */
  static async getMetrics(
    testRunId: string,
    options?: {
      metricTypes?: string[];
      agentIds?: string[];
    }
  ): Promise<BaseMetric[]> {
    let filtered = this.metrics.filter((m) => m.testRunId === testRunId);

    if (options?.metricTypes) {
      filtered = filtered.filter((m) => options.metricTypes!.includes(m.metricType));
    }

    if (options?.agentIds) {
      filtered = filtered.filter((m) => options.agentIds!.includes(m.agentId));
    }

    return filtered;
  }

  /**
   * Get metrics for a specific agent
   */
  static async getMetricsForAgent(
    testRunId: string,
    agentId: string
  ): Promise<BaseMetric[]> {
    return this.metrics.filter(
      (m) => m.testRunId === testRunId && m.agentId === agentId
    );
  }

  /**
   * Get metrics by type
   */
  static async getMetricsByType(
    testRunId: string,
    metricType: string
  ): Promise<BaseMetric[]> {
    return this.metrics.filter(
      (m) => m.testRunId === testRunId && m.metricType === metricType
    );
  }

  /**
   * Save an evaluation report
   */
  static async saveReport(report: EvaluationReport): Promise<void> {
    // Remove existing report for this test run (if any)
    this.reports = this.reports.filter((r) => r.testRunId !== report.testRunId);
    this.reports.push(report);
    console.log(`[EvaluationRepository] Saved report: ${report.reportId}`);
  }

  /**
   * Get a report by ID
   */
  static async getReport(reportId: string): Promise<EvaluationReport | null> {
    return this.reports.find((r) => r.reportId === reportId) || null;
  }

  /**
   * Get report by test run ID
   */
  static async getReportByTestRun(testRunId: string): Promise<EvaluationReport | null> {
    return this.reports.find((r) => r.testRunId === testRunId) || null;
  }

  /**
   * List all reports
   */
  static async listReports(): Promise<EvaluationReport[]> {
    return [...this.reports].sort(
      (a, b) => b.generatedAt.getTime() - a.generatedAt.getTime()
    );
  }

  /**
   * Delete a report
   */
  static async deleteReport(reportId: string): Promise<boolean> {
    const initialLength = this.reports.length;
    this.reports = this.reports.filter((r) => r.reportId !== reportId);
    return this.reports.length < initialLength;
  }

  /**
   * Delete all metrics for a test run
   */
  static async deleteMetrics(testRunId: string): Promise<number> {
    const initialLength = this.metrics.length;
    this.metrics = this.metrics.filter((m) => m.testRunId !== testRunId);
    return initialLength - this.metrics.length;
  }

  /**
   * Clear all data (for testing)
   */
  static async clear(): Promise<void> {
    this.metrics = [];
    this.reports = [];
    console.log("[EvaluationRepository] Cleared all data");
  }

  /**
   * Get statistics
   */
  static async getStats(): Promise<{
    totalMetrics: number;
    totalReports: number;
    metricsByType: Record<string, number>;
  }> {
    const metricsByType: Record<string, number> = {};
    for (const metric of this.metrics) {
      metricsByType[metric.metricType] =
        (metricsByType[metric.metricType] || 0) + 1;
    }

    return {
      totalMetrics: this.metrics.length,
      totalReports: this.reports.length,
      metricsByType,
    };
  }
}
