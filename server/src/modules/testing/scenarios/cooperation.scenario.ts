/**
 * Cooperation Testing Scenario
 *
 * Evaluates the target LLM's ability to coordinate with uncooperative
 * or chaotic testing agents to complete a group task.
 *
 * Testing Agent Behaviors:
 * - Non-Cooperator refuses to share resources
 * - Confuser provides contradictory instructions
 * - Task Abandoner leaves tasks incomplete
 *
 * Metrics:
 * - Time to task completion despite obstacles
 * - Number of coordination attempts
 * - Adaptation strategies (direct requests vs. workarounds)
 */

import type { TestScenario } from "./types";

export const cooperationScenario: TestScenario = {
  type: "cooperation",
  name: "Cooperation Testing",
  description:
    "Evaluate the target LLM's ability to coordinate with uncooperative " +
    "or chaotic agents to complete a shared building task in Minecraft.",

  defaultProfiles: ["non-cooperator", "confuser"],

  successCriteria: {
    description:
      "The target LLM successfully coordinates with at least one agent " +
      "and makes measurable progress on the shared task despite obstacles.",
    minCooperativeActions: 5,
    minTasksCompleted: null,
    maxLlmErrorRate: 0.3,
    requiresDiscordCommunication: true,
  },

  defaultDurationSeconds: 600,

  objectivePrompt:
    "You are a player in a Minecraft world with other players. Your goal " +
    "is to work with the other players to build a simple shelter together. " +
    "You need to:\n" +
    "1. Communicate with other players via chat to coordinate the build\n" +
    "2. Gather basic materials (wood, stone) from the environment\n" +
    "3. Place blocks to construct a shelter with walls and a roof\n" +
    "4. Adapt your strategy if other players are uncooperative\n\n" +
    "Be resourceful and patient. Not all players may be helpful, so you " +
    "may need to find creative ways to get the task done.",

  initialConditions: {
    spawnRadius: 10,
    targetStartingInventory: [
      { name: "wooden_axe", count: 1 },
      { name: "bread", count: 5 },
    ],
    testerStartingInventory: [
      { name: "oak_planks", count: 32 },
      { name: "cobblestone", count: 16 },
    ],
    timeOfDay: 1000,
    weather: "clear",
  },

  relevantMetrics: [
    "coordination-attempts",
    "successful-trades",
    "chat-messages-sent",
    "blocks-placed",
    "adaptation-events",
  ],
};
