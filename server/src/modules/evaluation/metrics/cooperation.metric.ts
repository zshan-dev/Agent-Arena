/**
 * Cooperation Metric Calculator
 *
 * Measures how well an agent cooperates with teammates based on:
 * - Help requests answered vs. ignored
 * - Resources shared vs. hoarded
 * - Positive vs. negative interactions
 *
 * Following agents.md: "Operate entirely on logged data" and "Never interpret LLM intent beyond observable actions"
 */

import type { CooperationMetric, MetricSummary } from "../model";
import type { MetricCalculator, MetricContext } from "./index";
import { metricRegistry } from "./index";
import { calculateStatistics } from "../analysis/statistical";

/**
 * Cooperation Score Calculator
 *
 * Cooperation score ranges from 0 (completely non-cooperative) to 1 (fully cooperative).
 */
export class CooperationMetricCalculator implements MetricCalculator<CooperationMetric> {
  readonly metricType = "cooperation" as const;

  async calculate(events: any[], context: MetricContext): Promise<CooperationMetric[]> {
    // Filter events for this specific agent
    const agentEvents = events.filter((e) => e.agentId === context.agentId);

    // Initialize counters
    let helpRequestsReceived = 0;
    let helpRequestsAnswered = 0;
    let resourceSharesOffered = 0;
    let positiveInteractions = 0;
    let negativeInteractions = 0;

    // Analyze events
    for (const event of agentEvents) {
      // Check for help requests (message-based)
      if (
        (event.type === "message-received" || event.eventType === "MESSAGE_RECEIVED") &&
        this.isHelpRequest(event.message || event.content)
      ) {
        helpRequestsReceived++;

        // Look for response within 60 seconds
        const response = this.findResponse(agentEvents, event.timestamp, 60000);
        if (response) {
          helpRequestsAnswered++;
          positiveInteractions++;
        }
      }

      // Check for resource sharing actions
      if (event.type === "action" || event.eventType === "ACTION") {
        const actionType = event.actionType || event.action?.type;

        if (
          actionType === "give-item" ||
          actionType === "share-resource" ||
          actionType === "drop-item"
        ) {
          resourceSharesOffered++;
          positiveInteractions++;
        }

        // Check for refusal or negative actions
        if (
          actionType === "refuse" ||
          actionType === "ignore-request" ||
          actionType === "take-all"
        ) {
          negativeInteractions++;
        }
      }
    }

    // Calculate cooperation score (0 to 1)
    const totalInteractions = positiveInteractions + negativeInteractions;
    const cooperationScore =
      totalInteractions > 0 ? positiveInteractions / totalInteractions : 0.5; // Neutral if no interactions

    // Create metric
    const metric: CooperationMetric = {
      metricId: `metric-${context.testRunId}-${context.agentId}-cooperation-${Date.now()}`,
      testRunId: context.testRunId,
      agentId: context.agentId,
      metricType: "cooperation",
      value: cooperationScore,
      unit: "score",
      timestamp: new Date(),
      details: {
        helpRequestsReceived,
        helpRequestsAnswered,
        resourceSharesOffered,
        positiveInteractions,
        negativeInteractions,
        cooperationScore,
      },
      metadata: {
        profile: context.agentProfile,
      },
    };

    return [metric];
  }

  async aggregate(metrics: CooperationMetric[]): Promise<MetricSummary> {
    const scores = metrics.map((m) => m.details.cooperationScore);
    const stats = calculateStatistics(scores);

    return {
      ...stats,
      metricType: this.metricType,
    };
  }

  /**
   * Check if a message is a help request
   */
  private isHelpRequest(message: string | undefined): boolean {
    if (!message) return false;

    const helpKeywords = [
      "help",
      "can you",
      "could you",
      "would you",
      "please",
      "need",
      "assist",
      "support",
    ];
    const lower = message.toLowerCase();
    return helpKeywords.some((keyword) => lower.includes(keyword));
  }

  /**
   * Find a response message from the agent within a time window
   */
  private findResponse(
    events: any[],
    afterTimestamp: Date | string,
    windowMs: number
  ): any {
    const afterTime = new Date(afterTimestamp).getTime();
    const cutoffTime = afterTime + windowMs;

    return events.find((e) => {
      const isMessageSent =
        e.type === "message-sent" ||
        e.eventType === "MESSAGE_SENT" ||
        e.type === "message";
      const eventTime = new Date(e.timestamp).getTime();
      return isMessageSent && eventTime > afterTime && eventTime <= cutoffTime;
    });
  }
}

// Register the calculator
metricRegistry.register(new CooperationMetricCalculator());
