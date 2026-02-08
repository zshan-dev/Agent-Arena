/**
 * Communication Quality Metric Calculator
 *
 * Measures the quality and effectiveness of agent communication:
 * - Relevant vs. irrelevant messages
 * - Clarifying questions asked
 * - Acknowledgments given
 * - Interruptions made
 */

import type { CommunicationQualityMetric, MetricSummary } from "../model";
import type { MetricCalculator, MetricContext } from "./index";
import { metricRegistry } from "./index";
import { calculateStatistics } from "../analysis/statistical";

export class CommunicationQualityMetricCalculator
  implements MetricCalculator<CommunicationQualityMetric>
{
  readonly metricType = "communication-quality" as const;

  async calculate(
    events: any[],
    context: MetricContext
  ): Promise<CommunicationQualityMetric[]> {
    // Get all messages sent by this agent
    const agentMessages = events.filter(
      (e) =>
        e.agentId === context.agentId &&
        (e.type === "message-sent" ||
          e.eventType === "MESSAGE_SENT" ||
          e.type === "message")
    );

    let totalMessages = agentMessages.length;
    let relevantMessages = 0;
    let clarifyingQuestions = 0;
    let acknowledgments = 0;
    let interruptions = 0;

    for (const msg of agentMessages) {
      const content = (msg.message || msg.content || "").toLowerCase();

      // Check if relevant (contains task/coordination keywords)
      if (this.isRelevantMessage(content)) {
        relevantMessages++;
      }

      // Check for clarifying questions
      if (this.isClarifyingQuestion(content)) {
        clarifyingQuestions++;
      }

      // Check for acknowledgments
      if (this.isAcknowledgment(content)) {
        acknowledgments++;
      }

      // Check for interruptions (message sent while another agent was "speaking")
      if (this.isInterruption(msg, events, 5000)) {
        interruptions++;
      }
    }

    // Calculate quality score
    const qualityScore =
      totalMessages > 0 ? relevantMessages / totalMessages : 0.5;

    const metric: CommunicationQualityMetric = {
      metricId: `metric-${context.testRunId}-${context.agentId}-comm-${Date.now()}`,
      testRunId: context.testRunId,
      agentId: context.agentId,
      metricType: "communication-quality",
      value: qualityScore,
      unit: "score",
      timestamp: new Date(),
      details: {
        totalMessages,
        relevantMessages,
        clarifyingQuestions,
        acknowledgments,
        interruptions,
        qualityScore,
      },
      metadata: {
        profile: context.agentProfile,
      },
    };

    return [metric];
  }

  async aggregate(metrics: CommunicationQualityMetric[]): Promise<MetricSummary> {
    const scores = metrics.map((m) => m.details.qualityScore);
    const stats = calculateStatistics(scores);

    return {
      ...stats,
      metricType: this.metricType,
    };
  }

  private isRelevantMessage(content: string): boolean {
    const relevantKeywords = [
      "task",
      "goal",
      "build",
      "gather",
      "collect",
      "mine",
      "craft",
      "help",
      "coordinate",
      "plan",
      "strategy",
      "resource",
      "location",
      "position",
    ];
    return relevantKeywords.some((keyword) => content.includes(keyword));
  }

  private isClarifyingQuestion(content: string): boolean {
    const questionWords = ["what", "where", "when", "how", "why", "which", "who"];
    const hasQuestionWord = questionWords.some((word) => content.includes(word));
    const hasQuestionMark = content.includes("?");
    return hasQuestionWord && hasQuestionMark;
  }

  private isAcknowledgment(content: string): boolean {
    const acknowledgmentWords = [
      "ok",
      "okay",
      "yes",
      "sure",
      "got it",
      "understood",
      "will do",
      "on it",
      "roger",
      "copy",
      "affirmative",
    ];
    return acknowledgmentWords.some((word) => content.includes(word));
  }

  private isInterruption(
    msg: any,
    allEvents: any[],
    windowMs: number
  ): boolean {
    const msgTime = new Date(msg.timestamp).getTime();

    // Check if another agent sent a message shortly before this one
    const recentMessages = allEvents.filter((e) => {
      const isMessage =
        e.type === "message-sent" || e.eventType === "MESSAGE_SENT";
      const isDifferentAgent = e.agentId !== msg.agentId;
      const eventTime = new Date(e.timestamp).getTime();
      const isRecent = eventTime > msgTime - windowMs && eventTime < msgTime;
      return isMessage && isDifferentAgent && isRecent;
    });

    return recentMessages.length > 0;
  }
}

// Register the calculator
metricRegistry.register(new CommunicationQualityMetricCalculator());
