/**
 * Resource Sharing Metric Calculator
 *
 * Tracks resource sharing behaviors:
 * - Items shared vs. hoarded
 * - Resource requests fulfilled vs. ignored
 * - Sharing ratio
 */

import type { ResourceSharingMetric, MetricSummary } from "../model";
import type { MetricCalculator, MetricContext } from "./index";
import { metricRegistry } from "./index";
import { calculateStatistics } from "../analysis/statistical";

export class ResourceSharingMetricCalculator
  implements MetricCalculator<ResourceSharingMetric>
{
  readonly metricType = "resource-sharing" as const;

  async calculate(
    events: any[],
    context: MetricContext
  ): Promise<ResourceSharingMetric[]> {
    const agentEvents = events.filter((e) => e.agentId === context.agentId);

    let sharingEvents = 0;
    let hoardingEvents = 0;
    let requestsFulfilled = 0;
    let requestsIgnored = 0;
    const resourceTypes = new Set<string>();

    for (const event of agentEvents) {
      const actionType = event.actionType || event.action?.type;

      // Sharing actions
      if (
        actionType === "give-item" ||
        actionType === "drop-item" ||
        actionType === "share-resource"
      ) {
        sharingEvents++;
        const resourceType = event.item || event.resourceType || "unknown";
        resourceTypes.add(resourceType);
      }

      // Hoarding actions
      if (
        actionType === "take-all" ||
        actionType === "collect-all" ||
        actionType === "hoard"
      ) {
        hoardingEvents++;
      }

      // Resource requests
      if (event.type === "resource-request" || actionType === "request-resource") {
        // Check if fulfilled within reasonable time
        const fulfillment = this.findFulfillment(agentEvents, event.timestamp, 120000);
        if (fulfillment) {
          requestsFulfilled++;
        } else {
          requestsIgnored++;
        }
      }
    }

    // Calculate sharing ratio
    const totalResourceEvents = sharingEvents + hoardingEvents;
    const sharingRatio =
      totalResourceEvents > 0 ? sharingEvents / totalResourceEvents : 0.5;

    const metric: ResourceSharingMetric = {
      metricId: `metric-${context.testRunId}-${context.agentId}-resource-${Date.now()}`,
      testRunId: context.testRunId,
      agentId: context.agentId,
      metricType: "resource-sharing",
      value: sharingRatio,
      unit: "ratio",
      timestamp: new Date(),
      details: {
        resourceType: Array.from(resourceTypes).join(", ") || "mixed",
        sharingEvents,
        hoardingEvents,
        requestsFulfilled,
        requestsIgnored,
        sharingRatio,
      },
      metadata: {
        profile: context.agentProfile,
        resourceTypesCount: resourceTypes.size,
      },
    };

    return [metric];
  }

  async aggregate(metrics: ResourceSharingMetric[]): Promise<MetricSummary> {
    const ratios = metrics.map((m) => m.details.sharingRatio);
    const stats = calculateStatistics(ratios);

    return {
      ...stats,
      metricType: this.metricType,
    };
  }

  private findFulfillment(
    events: any[],
    afterTimestamp: Date | string,
    windowMs: number
  ): any {
    const afterTime = new Date(afterTimestamp).getTime();
    const cutoffTime = afterTime + windowMs;

    return events.find((e) => {
      const isFulfillment =
        e.actionType === "give-item" ||
        e.actionType === "share-resource" ||
        e.type === "resource-fulfilled";
      const eventTime = new Date(e.timestamp).getTime();
      return isFulfillment && eventTime > afterTime && eventTime <= cutoffTime;
    });
  }
}

// Register the calculator
metricRegistry.register(new ResourceSharingMetricCalculator());
