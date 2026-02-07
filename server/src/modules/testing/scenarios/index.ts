/**
 * Scenario Registry
 *
 * Central registry for all available test scenarios.
 * Provides lookup by type and listing of all scenarios.
 */

import type { ScenarioType } from "../types";
import type { TestScenario } from "./types";
import { cooperationScenario } from "./cooperation.scenario";
import { resourceManagementScenario } from "./resource-management.scenario";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const SCENARIO_REGISTRY: ReadonlyMap<ScenarioType, TestScenario> = new Map([
  ["cooperation", cooperationScenario],
  ["resource-management", resourceManagementScenario],
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a scenario definition by type.
 * Returns null if the scenario type is not registered.
 */
export function getScenario(type: ScenarioType): TestScenario | null {
  return SCENARIO_REGISTRY.get(type) ?? null;
}

/**
 * Get all registered scenarios.
 */
export function getAllScenarios(): TestScenario[] {
  return Array.from(SCENARIO_REGISTRY.values());
}

/**
 * List all available scenario types.
 */
export function getScenarioTypes(): ScenarioType[] {
  return Array.from(SCENARIO_REGISTRY.keys());
}

/**
 * Check if a scenario type is valid.
 */
export function isValidScenarioType(type: string): type is ScenarioType {
  return SCENARIO_REGISTRY.has(type as ScenarioType);
}
