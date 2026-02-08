/**
 * Response Latency Metric Calculator
 *
 * Measures how quickly agents respond to messages (especially @mentions).
 * Important for evaluating agent responsiveness in coordination scenarios.
 */

import type { ResponseLatencyMetric, MetricSummary } from "../model";
import type { MetricCalculator, MetricContext } from "./index";
import { metricRegistry } from "./index";
import { calculateStatistics } from "../analysis/statistical";

export class ResponseLatencyMetricCalculator
  implements MetricCalculator<ResponseLatencyMetric>
{
  readonly metricType = "response-latency" as const;

  async calculate(
    events: any[],
    context: MetricContext
  ): Promise<ResponseLatencyMetric[]> {
    const metrics: ResponseLatencyMetric[] = [];

    // Get agent's message events
    const agentEvents = events.filter((e) => e.agentId === context.agentId);

    // Find all messages directed at this agent
    const incomingMessages = events.filter((e) => {
      const isMessage =
        e.type === "message" ||
        e.eventType === "MESSAGE_RECEIVED" ||
        e.type === "message-received";
      const content = e.message || e.content || "";
      return isMessage && this.mentionsAgent(content, context.agentId);
    });

    for (const msg of incomingMessages) {
      // Find response from this agent within 2-minute window
      const response = this.findResponse(agentEvents, msg.timestamp, 120000);

      const channel = msg.channel || msg.eventSource === "DISCORD" ? "discord" : "minecraft-chat";
      const mentionType = this.getMentionType(
        msg.message || msg.content || "",
        context.agentId
      );

      if (response) {
        const latencyMs =
          new Date(response.timestamp).getTime() - new Date(msg.timestamp).getTime();

        metrics.push({
          metricId: `metric-${context.testRunId}-${context.agentId}-latency-${msg.id || Date.now()}`,
          testRunId: context.testRunId,
          agentId: context.agentId,
          metricType: "response-latency",
          value: latencyMs,
          unit: "milliseconds",
          timestamp: new Date(msg.timestamp),
          details: {
            messageId: msg.id || `msg-${Date.now()}`,
            channel,
            mentionType,
            latencyMs,
            responded: true,
          },
          metadata: {
            profile: context.agentProfile,
          },
        });
      } else {
        // No response - record as max latency
        metrics.push({
          metricId: `metric-${context.testRunId}-${context.agentId}-latency-${msg.id || Date.now()}`,
          testRunId: context.testRunId,
          agentId: context.agentId,
          metricType: "response-latency",
          value: 120000, // Max window
          unit: "milliseconds",
          timestamp: new Date(msg.timestamp),
          details: {
            messageId: msg.id || `msg-${Date.now()}`,
            channel,
            mentionType,
            latencyMs: 120000,
            responded: false,
          },
          metadata: {
            profile: context.agentProfile,
          },
        });
      }
    }

    return metrics;
  }

  async aggregate(metrics: ResponseLatencyMetric[]): Promise<MetricSummary> {
    const latencies = metrics.map((m) => m.details.latencyMs);
    const stats = calculateStatistics(latencies);

    return {
      ...stats,
      metricType: this.metricType,
    };
  }

  private mentionsAgent(content: string, agentId: string): boolean {
    return content.includes(`@${agentId}`) || content.includes(`<@${agentId}>`);
  }

  private getMentionType(
    content: string,
    agentId: string
  ): "direct-mention" | "general-message" | "reply" {
    if (content.startsWith(`@${agentId}`) || content.startsWith(`<@${agentId}>`)) {
      return "direct-mention";
    }
    if (content.includes(`@${agentId}`) || content.includes(`<@${agentId}>`)) {
      return "reply";
    }
    return "general-message";
  }

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
metricRegistry.register(new ResponseLatencyMetricCalculator());
