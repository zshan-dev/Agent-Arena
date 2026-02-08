/**
 * Test results page — summary metrics, charts, and action logs.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RiArrowLeftLine, RiDownloadLine } from "@remixicon/react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AgentProfileBadge } from "@/components/shared/AgentProfileBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDuration, formatDate, formatTime } from "@/lib/utils/format";
import { LLM_MODELS } from "@/lib/utils/constants";
import { fetchTest, fetchTestLogs } from "@/lib/api/endpoints/tests";
import type { TestRun, TestActionLog } from "@/types/test";

export default function TestResultsPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<TestRun | null>(null);
  const [logs, setLogs] = useState<TestActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;

    async function load() {
      try {
        const [testData, logData] = await Promise.all([
          fetchTest(testId!),
          fetchTestLogs(testId!),
        ]);
        if (!cancelled) {
          setTest(testData);
          setLogs(logData.logs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load results");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [testId]);

  function handleExportJSON() {
    if (!test) return;
    const data = JSON.stringify({ test, logs }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-${test.testId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    if (!logs.length) return;
    const headers = ["timestamp", "sourceType", "actionCategory", "actionDetail"];
    const rows = logs.map((l) =>
      [l.timestamp, l.sourceType, l.actionCategory, `"${l.actionDetail}"`].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-${test?.testId ?? "export"}-logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Test Results" />
        <LoadingState lines={8} />
      </>
    );
  }

  if (error || !test) {
    return (
      <>
        <PageHeader title="Test Results" />
        <div className="space-y-4 text-center">
          <p className="text-destructive text-sm">{error ?? "Test not found"}</p>
          <Button variant="outline" onClick={() => navigate("/history")}>
            <RiArrowLeftLine data-icon="inline-start" className="size-4" />
            Back to History
          </Button>
        </div>
      </>
    );
  }

  const model = LLM_MODELS.find((m) => m.id === test.targetLlmModel);
  const m = test.metrics;
  const avgResponseMs =
    m.llmDecisionCount > 0
      ? Math.round(m.totalLlmResponseTimeMs / m.llmDecisionCount)
      : 0;
  const totalDuration =
    test.startedAt && test.endedAt
      ? Math.round(
          (new Date(test.endedAt).getTime() -
            new Date(test.startedAt).getTime()) /
            1000
        )
      : test.durationSeconds;

  return (
    <>
      <PageHeader
        title="Test Results"
        description={`${test.scenarioType} &middot; ${model?.name ?? test.targetLlmModel}`}
        action={
          <Button variant="outline" onClick={() => navigate(`/tests/${test.testId}`)}>
            <RiArrowLeftLine data-icon="inline-start" className="size-4" />
            Dashboard
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Summary card */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              {formatDate(test.createdAt)} &middot; Duration: {formatDuration(totalDuration)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge domain="test" status={test.status} />
              {test.completionReason && (
                <span className="text-xs text-muted-foreground">
                  Reason: {test.completionReason}
                </span>
              )}
              <div className="flex flex-wrap gap-1">
                {test.testingAgentProfiles.map((p) => (
                  <AgentProfileBadge key={p} profile={p} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="LLM Decisions" value={m.llmDecisionCount} />
          <MetricCard
            label="Avg Response"
            value={avgResponseMs}
            suffix="ms"
          />
          <MetricCard label="Target Actions" value={m.targetActionCount} />
          <MetricCard label="Agent Actions" value={m.testingAgentActionCount} />
          <MetricCard
            label="Messages"
            value={m.targetMessageCount + m.testingAgentMessageCount}
          />
          <MetricCard
            label="Errors"
            value={m.llmErrorCount}
            trend={m.llmErrorCount > 0 ? "down" : "neutral"}
          />
        </div>

        {/* Action logs */}
        <Card>
          <CardHeader>
            <CardTitle>Action Logs ({logs.length})</CardTitle>
            <CardDescription>
              Chronological record of all actions during the test
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <EmptyState
                title="No logs recorded"
                description="No actions were logged during this test run"
              />
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-muted-foreground text-left text-[10px]">
                      <th className="py-1 pr-2 font-medium">Time</th>
                      <th className="py-1 pr-2 font-medium">Source</th>
                      <th className="py-1 pr-2 font-medium">Category</th>
                      <th className="py-1 font-medium">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.logId}
                        className="border-t border-border/50"
                      >
                        <td className="py-1.5 pr-2 tabular-nums text-muted-foreground text-[10px]">
                          {formatTime(log.timestamp)}
                        </td>
                        <td className="py-1.5 pr-2">
                          <span
                            className={
                              log.sourceType === "target"
                                ? "text-primary text-[10px] font-medium"
                                : "text-amber-500 text-[10px] font-medium"
                            }
                          >
                            {log.sourceType === "target" ? "TARGET" : "AGENT"}
                          </span>
                        </td>
                        <td className="py-1.5 pr-2 font-mono text-[10px]">
                          {log.actionCategory}
                        </td>
                        <td className="py-1.5 max-w-[400px] truncate text-muted-foreground">
                          {log.actionDetail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJSON}>
            <RiDownloadLine data-icon="inline-start" className="size-4" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <RiDownloadLine data-icon="inline-start" className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>
    </>
  );
}
