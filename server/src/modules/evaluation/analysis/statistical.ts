/**
 * Statistical Analysis Utilities
 *
 * Deterministic statistical functions for metric aggregation and analysis.
 * Following agents.md requirement: "Use deterministic scoring algorithms"
 */

import type { MetricSummary } from "../model";

/**
 * Calculate basic statistics for a dataset
 * 
 * @param values - Array of numeric values
 * @returns Statistical summary with mean, median, stdDev, min, max, count
 */
export function calculateStatistics(values: number[]): MetricSummary {
  if (values.length === 0) {
    return {
      metricType: "unknown",
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      count: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  // Median calculation
  const median =
    count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];

  // Standard deviation
  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  const min = sorted[0];
  const max = sorted[count - 1];

  return {
    metricType: "unknown", // Will be set by caller
    mean,
    median,
    stdDev,
    min,
    max,
    count,
  };
}

/**
 * Calculate confidence interval for a dataset (95% confidence)
 * 
 * Assumes normal distribution. For production use, consider using
 * a statistical library for more robust calculations.
 * 
 * @param values - Array of numeric values
 * @param confidenceLevel - Confidence level (default 0.95 for 95%)
 * @returns Object with lower and upper bounds
 */
export function calculateConfidenceInterval(
  values: number[],
  confidenceLevel: number = 0.95
): {
  lower: number;
  upper: number;
  confidenceLevel: number;
} {
  if (values.length === 0) {
    return { lower: 0, upper: 0, confidenceLevel };
  }

  const stats = calculateStatistics(values);
  const mean = stats.mean;
  const stdDev = stats.stdDev;
  const n = values.length;

  // Z-score for 95% confidence interval
  const zScore = confidenceLevel === 0.95 ? 1.96 : 2.576; // 95% or 99%
  const standardError = stdDev / Math.sqrt(n);
  const marginOfError = zScore * standardError;

  return {
    lower: mean - marginOfError,
    upper: mean + marginOfError,
    confidenceLevel,
  };
}

/**
 * Calculate percentile for a value in a dataset
 * 
 * @param values - Array of numeric values
 * @param percentile - Percentile to calculate (0-100)
 * @returns Value at the given percentile
 */
export function calculatePercentile(
  values: number[],
  percentile: number
): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Detect outliers using IQR method
 * 
 * @param values - Array of numeric values
 * @returns Array of outlier values
 */
export function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return []; // Need at least 4 values for IQR

  const q1 = calculatePercentile(values, 25);
  const q3 = calculatePercentile(values, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return values.filter((v) => v < lowerBound || v > upperBound);
}

/**
 * Compare two datasets using t-test (Welch's t-test)
 * 
 * Returns t-statistic and degrees of freedom.
 * For production use, consider using a statistical library for p-value calculation.
 * 
 * @param sample1 - First dataset
 * @param sample2 - Second dataset
 * @returns Object with t-statistic and degrees of freedom
 */
export function compareDatasets(
  sample1: number[],
  sample2: number[]
): {
  tStatistic: number;
  degreesOfFreedom: number;
  significant: boolean;
} {
  const n1 = sample1.length;
  const n2 = sample2.length;

  if (n1 === 0 || n2 === 0) {
    return { tStatistic: 0, degreesOfFreedom: 0, significant: false };
  }

  const stats1 = calculateStatistics(sample1);
  const stats2 = calculateStatistics(sample2);

  const mean1 = stats1.mean;
  const mean2 = stats2.mean;
  const var1 = Math.pow(stats1.stdDev, 2);
  const var2 = Math.pow(stats2.stdDev, 2);

  // Welch's t-statistic
  const tStatistic = (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);

  // Welch-Satterthwaite degrees of freedom
  const numerator = Math.pow(var1 / n1 + var2 / n2, 2);
  const denominator =
    Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1);
  const degreesOfFreedom = Math.floor(numerator / denominator);

  // Simple significance test (|t| > 2 is roughly significant at 95%)
  const significant = Math.abs(tStatistic) > 2;

  return {
    tStatistic,
    degreesOfFreedom,
    significant,
  };
}

/**
 * Calculate correlation coefficient between two datasets
 * 
 * Returns Pearson correlation coefficient (-1 to 1)
 * 
 * @param x - First dataset
 * @param y - Second dataset
 * @returns Correlation coefficient
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce(
    (sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY),
    0
  );

  const denomX = Math.sqrt(
    x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0)
  );
  const denomY = Math.sqrt(
    y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0)
  );

  if (denomX === 0 || denomY === 0) return 0;

  return numerator / (denomX * denomY);
}
