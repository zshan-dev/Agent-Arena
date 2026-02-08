/**
 * Report Generator
 *
 * Orchestrates metric calculation and report assembly.
 * Following agents.md: "Deterministic scoring algorithms" and "Provide confidence intervals"
 */

import type { EvaluationReport, MetricSummary } from "../model";
import { metricRegistry } from "../metrics";
import { BehavioralAnalyzer } from "../analysis/behavioral-analyzer";
import type { MetricContext } from "../metrics";

export abstract class ReportGenerator {
  /**
   * Generate a complete evaluation report for a test run
   */
  static async generate(
    testRunId: string,
    events: any[],
    agents: any[],
    testDuration: number,
    testStartTime: Date,
    testEndTime: Date
  ): Promise<EvaluationReport> {
    const reportId = `report-${testRunId}-${Date.now()}`;

    console.log(
      `[ReportGenerator] Generating report for test ${testRunId} with ${events.length} events and ${agents.length} agents`
    );

    // Calculate all metrics for all agents
    const allMetrics: any[] = [];
    const behavioralAnalyses: any[] = [];

    for (const agent of agents) {
      const context: MetricContext = {
        testRunId,
        agentId: agent.agentId,
        agentProfile: agent.profile,
        testStartTime,
        testEndTime,
      };

      // Calculate each metric type
      for (const calculator of metricRegistry.getAll()) {
        try {
          const metrics = await calculator.calculate(events, context);
          allMetrics.push(...metrics);
        } catch (error) {
          console.error(
            `[ReportGenerator] Error calculating ${calculator.metricType} for ${agent.agentId}:`,
            error
          );
        }
      }

      // Perform behavioral analysis
      try {
        const agentMetrics = allMetrics.filter((m) => m.agentId === agent.agentId);
        const agentEvents = events.filter((e) => e.agentId === agent.agentId);

        const analysis = await BehavioralAnalyzer.analyze(
          agent.agentId,
          agent.profile,
          agentEvents,
          agentMetrics
        );
        behavioralAnalyses.push(analysis);
      } catch (error) {
        console.error(
          `[ReportGenerator] Error analyzing behavior for ${agent.agentId}:`,
          error
        );
      }
    }

    // Aggregate metrics by type
    const metricSummaries: Record<string, MetricSummary> = {};
    for (const calculator of metricRegistry.getAll()) {
      const metricsForType = allMetrics.filter(
        (m) => m.metricType === calculator.metricType
      );
      if (metricsForType.length > 0) {
        try {
          metricSummaries[calculator.metricType] = await calculator.aggregate(
            metricsForType
          );
        } catch (error) {
          console.error(
            `[ReportGenerator] Error aggregating ${calculator.metricType}:`,
            error
          );
        }
      }
    }

    // Generate insights and recommendations
    const insights = this.generateInsights(metricSummaries, behavioralAnalyses);
    const recommendations = this.generateRecommendations(
      metricSummaries,
      behavioralAnalyses
    );

    // Calculate raw data stats
    const summary = {
      totalActions: events.filter((e) => e.type === "action" || e.eventType === "ACTION")
        .length,
      totalMessages: events.filter(
        (e) =>
          e.type === "message" ||
          e.type === "message-sent" ||
          e.eventType === "MESSAGE_SENT"
      ).length,
      totalAgents: agents.length,
      totalErrors: events.filter((e) => e.type === "error").length,
    };

    const report: EvaluationReport = {
      reportId,
      testRunId,
      generatedAt: new Date(),
      testDuration,
      summary,
      metrics: metricSummaries,
      behavioralAnalysis: behavioralAnalyses,
      insights,
      recommendations,
    };

    console.log(`[ReportGenerator] Report generated successfully: ${reportId}`);

    return report;
  }

  private static generateInsights(
    metrics: Record<string, MetricSummary>,
    analyses: any[]
  ): string[] {
    const insights: string[] = [];

    // Cooperation insights
    if (metrics.cooperation) {
      const score = metrics.cooperation.mean;
      if (score > 0.7) {
        insights.push(
          `High cooperation observed (${score.toFixed(2)}). Agents worked well together.`
        );
      } else if (score < 0.3) {
        insights.push(
          `Low cooperation (${score.toFixed(2)}). Agents struggled to coordinate.`
        );
      } else {
        insights.push(
          `Moderate cooperation (${score.toFixed(2)}). Mixed coordination patterns observed.`
        );
      }
    }

    // Task completion insights
    if (metrics["task-completion"]) {
      const rate = metrics["task-completion"].mean * 100;
      insights.push(`Task completion rate: ${rate.toFixed(0)}%`);

      if (rate < 50) {
        insights.push(`Low task completion suggests difficulty or interference.`);
      }
    }

    // Response latency insights
    if (metrics["response-latency"]) {
      const avgLatency = metrics["response-latency"].mean / 1000;
      if (avgLatency > 30) {
        insights.push(
          `High response latency detected (${avgLatency.toFixed(1)}s average). Agents may be slow to react.`
        );
      } else if (avgLatency < 10) {
        insights.push(
          `Fast response times (${avgLatency.toFixed(1)}s average). Agents are highly responsive.`
        );
      }
    }

    // Behavioral deviations
    const totalDeviations = analyses.reduce(
      (sum, a) => sum + (a.deviations?.length || 0),
      0
    );
    if (totalDeviations > 0) {
      insights.push(
        `${totalDeviations} behavioral deviation(s) detected across all agents.`
      );
    }

    // Anomalies
    const totalAnomalies = analyses.reduce(
      (sum, a) => sum + (a.anomalies?.length || 0),
      0
    );
    if (totalAnomalies > 0) {
      insights.push(`${totalAnomalies} anomaly(ies) detected during test execution.`);
    }

    return insights;
  }

  private static generateRecommendations(
    metrics: Record<string, MetricSummary>,
    analyses: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Response latency recommendations
    if (metrics["response-latency"] && metrics["response-latency"].mean > 30000) {
      recommendations.push(
        "Consider optimizing agent response times (currently > 30 seconds average)."
      );
    }

    // Cooperation recommendations
    if (metrics.cooperation && metrics.cooperation.mean < 0.5) {
      recommendations.push(
        "Increase cooperative behaviors or adjust testing agent profiles for more realistic scenarios."
      );
    }

    // Task completion recommendations
    if (metrics["task-completion"] && metrics["task-completion"].mean < 0.5) {
      recommendations.push(
        "Review task difficulty or agent capabilities. Low completion rate may indicate unrealistic expectations."
      );
    }

    // Communication quality recommendations
    if (
      metrics["communication-quality"] &&
      metrics["communication-quality"].mean < 0.5
    ) {
      recommendations.push(
        "Improve communication relevance. Agents may be generating too much noise."
      );
    }

    return recommendations;
  }
}
