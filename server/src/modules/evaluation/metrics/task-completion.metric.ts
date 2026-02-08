/**
 * Task Completion Metric Calculator
 *
 * Tracks whether agents complete assigned tasks and measures efficiency.
 * Metrics:
 * - Task completion rate (completed / started)
 * - Average completion time
 * - Failed vs. abandoned tasks
 */

import type { TaskCompletionMetric, MetricSummary } from "../model";
import type { MetricCalculator, MetricContext } from "./index";
import { metricRegistry } from "./index";
import { calculateStatistics } from "../analysis/statistical";

export class TaskCompletionMetricCalculator implements MetricCalculator<TaskCompletionMetric> {
  readonly metricType = "task-completion" as const;

  async calculate(events: any[], context: MetricContext): Promise<TaskCompletionMetric[]> {
    // Filter task-related events for this agent
    const taskEvents = events.filter(
      (e) =>
        e.agentId === context.agentId &&
        (e.type === "task" || e.eventType === "TASK" || e.eventSource === "TESTING")
    );

    // Count task statuses
    const tasksStarted = taskEvents.filter(
      (e) => e.status === "started" || e.actionType === "task-start"
    ).length;

    const tasksCompleted = taskEvents.filter(
      (e) => e.status === "completed" || e.actionType === "task-complete"
    ).length;

    const tasksFailed = taskEvents.filter(
      (e) => e.status === "failed" || e.actionType === "task-fail"
    ).length;

    const tasksAbandoned = taskEvents.filter(
      (e) => e.status === "abandoned" || e.actionType === "task-abandon"
    ).length;

    // Calculate completion rate
    const completionRate = tasksStarted > 0 ? tasksCompleted / tasksStarted : 0;

    // Calculate average completion time (if available)
    const completedTasks = taskEvents.filter((e) => e.status === "completed");
    let averageCompletionTime: number | undefined;

    if (completedTasks.length > 0) {
      const completionTimes = completedTasks
        .map((task) => {
          const startEvent = taskEvents.find(
            (e) => e.taskId === task.taskId && e.status === "started"
          );
          if (startEvent) {
            return (
              (new Date(task.timestamp).getTime() -
                new Date(startEvent.timestamp).getTime()) /
              1000
            );
          }
          return null;
        })
        .filter((t): t is number => t !== null);

      if (completionTimes.length > 0) {
        averageCompletionTime =
          completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
      }
    }

    const metric: TaskCompletionMetric = {
      metricId: `metric-${context.testRunId}-${context.agentId}-task-${Date.now()}`,
      testRunId: context.testRunId,
      agentId: context.agentId,
      metricType: "task-completion",
      value: completionRate,
      unit: "percentage",
      timestamp: new Date(),
      details: {
        tasksStarted,
        tasksCompleted,
        tasksFailed,
        tasksAbandoned,
        completionRate,
        averageCompletionTime,
      },
      metadata: {
        profile: context.agentProfile,
      },
    };

    return [metric];
  }

  async aggregate(metrics: TaskCompletionMetric[]): Promise<MetricSummary> {
    const rates = metrics.map((m) => m.details.completionRate);
    const stats = calculateStatistics(rates);

    return {
      ...stats,
      metricType: this.metricType,
    };
  }
}

// Register the calculator
metricRegistry.register(new TaskCompletionMetricCalculator());
