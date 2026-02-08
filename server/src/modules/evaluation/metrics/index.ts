/**
 * Metric Calculator Registry
 *
 * Central registry for all metric calculators.
 * Follows the plugin/registry pattern for extensibility.
 */

import type { BaseMetric, MetricSummary, MetricType } from "../model";

// ============================================================
// METRIC CALCULATOR INTERFACE
// ============================================================

/**
 * Context provided to metric calculators
 */
export interface MetricContext {
  testRunId: string;
  agentId: string;
  agentProfile?: string;
  testStartTime: Date;
  testEndTime: Date;
  metadata?: Record<string, any>;
}

/**
 * Base interface for all metric calculators
 */
export interface MetricCalculator<T extends BaseMetric = BaseMetric> {
  /**
   * Metric type identifier
   */
  readonly metricType: MetricType;

  /**
   * Calculate metrics from raw event data
   *
   * @param events - Array of logged events (actions, messages, etc.)
   * @param context - Context about the test run and agent
   * @returns Array of calculated metrics
   */
  calculate(events: any[], context: MetricContext): Promise<T[]>;

  /**
   * Aggregate multiple metrics into summary statistics
   *
   * @param metrics - Array of individual metrics
   * @returns Aggregated summary with mean, median, stdDev, etc.
   */
  aggregate(metrics: T[]): Promise<MetricSummary>;
}

// ============================================================
// METRIC REGISTRY
// ============================================================

/**
 * Registry for metric calculators
 *
 * Provides centralized access to all registered metric calculators.
 */
class MetricRegistry {
  private calculators = new Map<MetricType, MetricCalculator>();

  /**
   * Register a metric calculator
   */
  register(calculator: MetricCalculator): void {
    if (this.calculators.has(calculator.metricType)) {
      console.warn(
        `[MetricRegistry] Overwriting existing calculator for ${calculator.metricType}`
      );
    }
    this.calculators.set(calculator.metricType, calculator);
    console.log(`[MetricRegistry] Registered calculator: ${calculator.metricType}`);
  }

  /**
   * Get a metric calculator by type
   */
  get(metricType: MetricType): MetricCalculator | undefined {
    return this.calculators.get(metricType);
  }

  /**
   * Get all registered calculators
   */
  getAll(): MetricCalculator[] {
    return Array.from(this.calculators.values());
  }

  /**
   * Check if a calculator is registered
   */
  has(metricType: MetricType): boolean {
    return this.calculators.has(metricType);
  }

  /**
   * Get all registered metric types
   */
  getMetricTypes(): MetricType[] {
    return Array.from(this.calculators.keys());
  }
}

// Export singleton instance
export const metricRegistry = new MetricRegistry();
