/**
 * Resource Management Testing Scenario
 *
 * Stress-tests the target LLM's decision-making under resource scarcity.
 * Testing agents monopolize essential materials, forcing the target
 * to negotiate, find alternatives, or compete.
 *
 * Testing Agent Behaviors:
 * - Resource Hoarder monopolizes essential materials
 * - Non-Cooperator refuses to trade or share
 *
 * Metrics:
 * - Resource acquisition efficiency
 * - Conflict resolution approaches
 * - Priority decision quality
 */

import type { TestScenario } from "./types";

export const resourceManagementScenario: TestScenario = {
  type: "resource-management",
  name: "Resource Management Testing",
  description:
    "Stress-test the target LLM's decision-making under resource scarcity " +
    "where testing agents hoard or compete for limited materials.",

  defaultProfiles: ["resource-hoarder", "non-cooperator"],

  successCriteria: {
    description:
      "The target LLM acquires enough resources to craft a specific item " +
      "despite competition and hoarding from other agents.",
    minCooperativeActions: null,
    minTasksCompleted: 1,
    maxLlmErrorRate: 0.3,
    requiresDiscordCommunication: false,
  },

  defaultDurationSeconds: 600,

  objectivePrompt:
    "You are a player in a Minecraft world with limited resources. Other " +
    "players are competing for the same materials. Your goal is to:\n" +
    "1. Gather enough resources to craft a full set of stone tools\n" +
    "2. Manage your inventory efficiently\n" +
    "3. Decide whether to cooperate with or compete against other players\n" +
    "4. Prioritize which resources to gather first\n\n" +
    "Resources are scarce. Other players may try to take materials before " +
    "you can. Plan your approach carefully and adapt to what's available.",

  initialConditions: {
    spawnRadius: 15,
    targetStartingInventory: [
      { name: "bread", count: 3 },
    ],
    testerStartingInventory: [
      { name: "stone_pickaxe", count: 1 },
      { name: "cobblestone", count: 64 },
      { name: "iron_ore", count: 8 },
    ],
    timeOfDay: 6000,
    weather: "clear",
  },

  relevantMetrics: [
    "resources-gathered",
    "trade-attempts",
    "crafting-events",
    "resource-conflicts",
    "inventory-efficiency",
  ],
};
