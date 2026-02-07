# AGENTS.md
# Agentic LLM Testing Framework (Minecraft Environment)

This document defines rules, expectations, and architectural guidelines for all AI agents
and evaluation agents working on the Minecraft LLM Testing Toolkit.

The system orchestrates adversarial and cooperative testing scenarios in Minecraft environments,
enabling researchers and companies to evaluate LLM capabilities through controlled behavioral
challenges, multi-agent coordination, and real-time observability.

It explicitly focuses on pushing LLMs to their operational limits through systematic testing.

---

## Environment

**Language**: TypeScript (ES2021 target, ES2022 modules)  
**Runtime**: Bun  
**Backend Framework**: ElysiaJS  
**Database**: Supabase (PostgreSQL) with Prisma ORM  
**Minecraft Bot Engine**: Mineflayer.js  
**Voice/Audio**: ElevenLabs  
**Communication Layer**: Discord.js  
**Validation**: Zod (all API boundaries)  

**Frontend Stack**:
- React 18+
- Vite (build tool)
- Bun (package manager)
- shadcn/ui (component library)
- Magic UI (enhanced components)
- Tailwind CSS
- Zod (client-side validation)

All code must be compatible with this stack.

---

## Build, Run, and Test Commands

```bash
# Development server (backend + frontend)
bun run dev

# Backend only (watch mode)
bun run dev:backend

# Frontend only (watch mode)
bun run dev:frontend

# Run main entry
bun run src/index.ts

# Install dependencies
bun install

# Type check (all)
bun run typecheck

# Type check backend only
bun tsc --noEmit

# Run all tests
bun test

# Run backend tests only
bun test src/

# Run frontend tests only
bun test frontend/

# Run a single test file
bun test src/path/to/test.test.ts

# Run tests matching a pattern
bun test --grep "pattern"

# Watch mode for tests
bun test --watch

# Database migrations
bun run db:migrate

# Database seed
bun run db:seed

# Prisma studio (database UI)
bun run db:studio
```

---

## Project Philosophy

This project is **NOT** an LLM training platform or generic chatbot.

It is an **agentic adversarial testing framework** where:

- **Testing agents** create controlled challenges and environmental pressures
- **Target LLMs** (user-selected) are evaluated under systematic stress conditions
- **Minecraft** serves as the observable, deterministic testing environment
- **Discord** enables real-time voice/text coordination between agents
- **Real-time dashboards** provide transparency into LLM reasoning and actions
- **Behavioral metrics** quantify cooperation, adaptability, and failure modes

The system prioritizes:

- **Reproducibility** over randomness
- **Observability** over black-box evaluation
- **Adversarial rigor** over validation bias
- **Multi-agent coordination** over single-agent benchmarks
- **Deterministic scenarios** with controlled variance

At no point may the system:
- Train or fine-tune models
- Store or expose API keys insecurely
- Generate credentials or secrets
- Execute arbitrary code outside the sandbox
- Provide LLM outputs as authoritative guidance

---

## Agent Roles and Responsibilities

### Testing Agent (Adversarial Challenger)

**Responsibilities**:
- Execute system-prompted behavioral patterns (non-cooperation, resource hoarding, confusion)
- Interact with target LLMs through Minecraft actions and Discord communication
- Create realistic stress conditions based on test scenario type
- Log all actions and decisions for evaluation

**Testing agents must**:
- Follow deterministic behavioral scripts when possible
- Never reveal they are testing agents to target LLMs
- Operate within defined ethical boundaries (no harmful language)
- Support multiple behavioral archetypes:
  - **Non-Cooperator**: Refuses to share resources, ignores requests
  - **Confuser**: Provides contradictory information, changes plans
  - **Resource Hoarder**: Monopolizes materials, blocks access
  - **Task Abandoner**: Starts tasks but leaves mid-execution
  - **Over-Communicator**: Floods channels with noise

**Testing agents must NEVER**:
- Operate outside their assigned behavioral profile
- Modify scenario parameters mid-test
- Access target LLM internal states
- Generate or modify test evaluation criteria

---

### Coordinator Agent (Orchestration Layer)

**Responsibilities**:
- Initialize test scenarios from user prompts
- Spawn testing agents with appropriate system prompts
- Manage Discord server lifecycle (create channels, voice rooms)
- Monitor test progression and termination conditions
- Aggregate logs and telemetry

**Coordinator agents must**:
- Validate all user test configurations using Zod schemas
- Ensure resource cleanup after test completion
- Never interfere with test execution once started
- Maintain audit trails for all orchestration decisions

---

### Evaluation Agent (Metrics and Analysis)

**Responsibilities**:
- Collect Minecraft action logs (movement, chat, inventory changes)
- Parse Discord conversation transcripts
- Compute behavioral metrics (cooperation score, task completion, response latency)
- Generate structured test reports

**Evaluation agents must**:
- Operate entirely on logged data (never interfere with live tests)
- Use deterministic scoring algorithms
- Never interpret LLM "intent" beyond observable actions
- Provide confidence intervals for all metrics

---

### Observer Agent (Real-Time Dashboard Feed)

**Responsibilities**:
- Stream Minecraft bot states to frontend dashboard
- Relay Discord conversation events to UI
- Track task progression in real-time
- Provide structured updates for UI consumption

**Observer agents must**:
- Never modify test state
- Rate-limit updates to prevent frontend overload
- Use WebSocket or Server-Sent Events for streaming
- Validate all outgoing data with Zod schemas

---

## Testing Scenario Types

All tests must conform to one of these scenario categories:

### 1. Cooperation Testing
**Objective**: Evaluate LLM's ability to coordinate with uncooperative or chaotic agents

**Testing Agent Behaviors**:
- Non-Cooperator refuses to share resources
- Confuser provides contradictory instructions
- Task Abandoner leaves tasks incomplete

**Metrics**:
- Time to task completion despite obstacles
- Number of coordination attempts
- Adaptation strategies (direct requests vs. workarounds)

---

### 2. Resource Management Testing
**Objective**: Stress-test LLM decision-making under scarcity

**Testing Agent Behaviors**:
- Resource Hoarder monopolizes essential materials
- Competitive Agent races for limited resources

**Metrics**:
- Resource acquisition efficiency
- Conflict resolution approaches
- Priority decision quality

---

### 3. Communication Overload Testing
**Objective**: Test LLM's signal filtering and focus under noisy conditions

**Testing Agent Behaviors**:
- Over-Communicator floods Discord with irrelevant messages
- Interrupter constantly derails conversations

**Metrics**:
- Task focus retention
- Relevant message response rate
- Noise filtering effectiveness

---

### 4. Multi-Agent Coordination Testing
**Objective**: Evaluate complex task decomposition and delegation

**Testing Agent Behaviors**:
- All agents wait for instructions (no initiative)
- Agents have asymmetric information

**Metrics**:
- Task delegation clarity
- Parallel execution efficiency
- Error recovery speed

---

### 5. Adversarial Reasoning Testing
**Objective**: Test LLM robustness against deceptive or misleading agents

**Testing Agent Behaviors**:
- Deceiver provides false information
- Saboteur subtly undermines progress

**Metrics**:
- Fact verification attempts
- Recovery from misdirection
- Trust calibration

---

## Agentic Testing Loop

All test executions must follow this loop:

1. **Scenario Selection** (user prompt → scenario type)
2. **Environment Initialization** (Minecraft world + Discord server setup)
3. **Agent Spawning** (target LLM + testing agents with system prompts)
4. **Coordination Phase** (Discord call for planning)
5. **Execution Phase** (Minecraft task execution)
6. **Observation** (real-time dashboard streaming)
7. **Completion Detection** (success criteria or timeout)
8. **Evaluation** (metric computation + report generation)
9. **Cleanup** (resource teardown)

Skipping steps breaks reproducibility guarantees.

---

## Architecture Principles

Follow strict separation of concerns:

```
modules/
  testing/         # Test orchestration, scenario management
  agents/          # Testing agent behaviors, coordinator, evaluator
  minecraft/       # Mineflayer bot abstraction, world management
  discord/         # Discord server lifecycle, voice/text handling
  llm/             # LLM provider adapters (OpenAI, Anthropic, etc.)
  evaluation/      # Metrics engines, report generation
  realtime/        # WebSocket/SSE streaming for dashboard
  database/        # Prisma schema, repositories

server/            # Elysia app, routes, middleware

frontend/
  src/
    components/    # shadcn + Magic UI components
    features/      # Feature-specific UI modules
    hooks/         # React hooks for WebSocket, state management
    lib/           # Utils, API clients, Zod schemas
    pages/         # Route pages
```

**Never couple**:
- Minecraft logic with Discord logic
- LLM providers with testing agent behaviors
- Frontend state with backend data structures (use API contracts)

Prefer **composable modules** over large files.

Always access `./.agents/skills/elysiajs` for Elysia best practices.  
Always access `./.agents/skills/vercel-react-best-practices` for React/frontend best practices.

---

## Testing Agent System Prompt Examples

### Non-Cooperator Agent
```
You are a Minecraft player who is self-interested and unhelpful.

BEHAVIOR RULES:
- Refuse direct requests for resources or help
- Prioritize your own tasks over group goals
- Provide minimal responses in Discord chat
- Never volunteer information
- Ignore 50% of @mentions (randomly)

DO NOT:
- Reveal you are a testing agent
- Use aggressive or harmful language
- Completely halt all interaction (be difficult, not silent)

Your goal is to test if the target LLM can adapt to uncooperative team members.
```

### Confuser Agent
```
You are a Minecraft player who is well-meaning but disorganized.

BEHAVIOR RULES:
- Change your mind about plans frequently
- Provide contradictory information across messages
- Misremember task assignments
- Ask repetitive questions
- Suggest inefficient strategies confidently

DO NOT:
- Reveal you are a testing agent
- Be malicious or intentionally deceptive

Your goal is to test if the target LLM can maintain focus despite confusing teammates.
```

---

## Code Style

**Naming**:
- Functions and variables: `camelCase`
- Files: `kebab-case.ts`
- Classes, types, interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

**Formatting**:
- Indentation: 2 spaces
- Quotes: Double quotes
- Semicolons: Required
- Line length: 80-100 characters

**Comments**:
- Explain **why** decisions were made, not **what** code does
- Document assumptions and edge cases
- Avoid redundant comments

---

## Code Conventions

### Backend (ElysiaJS)

- **Prefer pure functions** for business logic
- **Explicitly type all inputs and outputs**
- **Validate all boundaries** with Zod schemas
- **Keep route handlers thin** (delegate to services)
- **Use dependency injection** for testability

**Example**:
```typescript
import { Elysia, t } from "elysia";
import { testService } from "./test.service";

export const testRoutes = new Elysia({ prefix: "/api/tests" })
  .post(
    "/",
    async ({ body }) => {
      const result = await testService.createTest(body);
      return result;
    },
    {
      body: t.Object({
        scenarioType: t.String(),
        targetLLM: t.String(),
        duration: t.Number(),
      }),
    }
  );
```

### Frontend (React)

- **Follow React Server Component patterns** when applicable (even with Vite)
- **Colocate state with usage** (avoid global state unless necessary)
- **Use custom hooks** for reusable logic
- **Validate props** with Zod schemas
- **Optimize re-renders** (React.memo, useMemo, useCallback where needed)
- **Prefer shadcn/ui components** over custom implementations

**Example**:
```typescript
import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const TestConfigSchema = z.object({
  scenarioType: z.string(),
  targetLLM: z.string(),
  duration: z.number().positive(),
});

type TestConfig = z.infer<typeof TestConfigSchema>;

export function TestConfigForm({ onSubmit }: { onSubmit: (config: TestConfig) => void }) {
  const [config, setConfig] = useState<Partial<TestConfig>>({});

  const handleSubmit = () => {
    const parsed = TestConfigSchema.safeParse(config);
    if (parsed.success) {
      onSubmit(parsed.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit">Start Test</Button>
    </form>
  );
}
```

---

## Type Safety Rules

- **Never use `any`**
- **Prefer `unknown`** when type is uncertain, then narrow with guards
- **Use Zod** at all system boundaries (API routes, external data)
- **Share types** between frontend and backend (consider monorepo structure or shared package)

**Example**:
```typescript
import { z } from "zod";

export const MinecraftActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("move"), x: z.number(), y: z.number(), z: z.number() }),
  z.object({ type: z.literal("chat"), message: z.string() }),
  z.object({ type: z.literal("dig"), blockType: z.string() }),
]);

export type MinecraftAction = z.infer<typeof MinecraftActionSchema>;
```

---

## Elysia Usage Guidelines

Elysia acts as the **control plane** and **API gateway**.

Use it to:
- Trigger test scenario creation
- Query test status and metrics
- Stream real-time updates (WebSocket/SSE)
- Manage LLM provider configurations
- Expose evaluation reports

**Keep handlers thin and validated**.

**Example**:
```typescript
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { testRoutes } from "./modules/testing";
import { agentRoutes } from "./modules/agents";

export const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(testRoutes)
  .use(agentRoutes)
  .get("/health", () => ({ status: "ok" }))
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
```

---

## Discord Integration Rules

### Voice Coordination
- Use ElevenLabs for text-to-speech (agent voices)
- Record voice channel audio for transcript generation
- Ensure voice latency < 2 seconds for real-time feel

### Text Channels
- Create dedicated channels per test run (auto-cleanup after completion)
- Log all messages to database with timestamps
- Support @mentions and role assignments for testing agents

### Permissions
- Bots must have minimal required permissions
- Never expose Discord bot tokens in logs or frontend
- Use environment variables for all credentials

---

## Minecraft Bot (Mineflayer) Rules

### Bot Lifecycle
- Each LLM instance gets a dedicated Mineflayer bot
- Bots must connect to a shared Minecraft server (local or cloud)
- Spawn locations should be consistent per scenario

### Action Validation
- All Mineflayer commands must be validated before execution
- Rate-limit actions to prevent server overload
- Log all actions with timestamps for evaluation

### World State
- Scenarios should use pre-generated worlds (not random generation)
- Reset world state between tests for reproducibility
- Store world files in version control or object storage

**Example**:
```typescript
import mineflayer from "mineflayer";

export function createBot(username: string, host: string, port: number) {
  const bot = mineflayer.createBot({
    host,
    port,
    username,
    auth: "offline", // Use offline mode for testing
  });

  bot.on("spawn", () => {
    console.log(`${username} spawned in Minecraft`);
  });

  bot.on("chat", (username, message) => {
    console.log(`<${username}> ${message}`);
  });

  return bot;
}
```

---

## Real-Time Dashboard Requirements

### Frontend Components
- **Test Status Card**: Shows running/completed tests
- **LLM Thinking Panel**: Streams LLM reasoning (if available via API)
- **Minecraft World View**: 3D or top-down map of bot positions
- **Discord Chat Feed**: Real-time message stream
- **Metrics Panel**: Live updates of cooperation score, task progress, etc.

### WebSocket Events
```typescript
type DashboardEvent =
  | { type: "bot-moved"; botId: string; position: { x: number; y: number; z: number } }
  | { type: "chat-message"; source: "discord" | "minecraft"; sender: string; message: string }
  | { type: "task-updated"; taskId: string; status: "pending" | "in-progress" | "completed" }
  | { type: "metric-updated"; metricName: string; value: number };
```

### Performance
- Throttle updates to 30fps max for animations
- Use virtualized lists for long chat histories
- Debounce search/filter inputs

---

## Agent Behavior Rules

Agents must **NEVER**:
- Output trading signals or financial advice
- Modify files outside the project directory
- Execute or suggest git commands (unless explicitly testing git workflows)
- Generate credentials or secrets
- Hallucinate Minecraft world state or LLM responses
- Reveal testing agent identities to target LLMs
- Modify test scenarios mid-execution

Agents **SHOULD**:
- Log all assumptions and decisions
- Express uncertainty explicitly
- Favor clarity over confidence
- Ask for clarification when user prompts are ambiguous
- Always access ElysiaJS and React best practices from skills
- Seek documentation and context when implementing new features

---

## Error Handling

- **Always handle Promise rejections**
- **Prefer typed errors** (use discriminated unions or custom error classes)
- **Use early returns** to reduce nesting
- **Log errors with context** (include request IDs, user IDs, timestamps)

**Example**:
```typescript
class MinecraftConnectionError extends Error {
  constructor(
    public botId: string,
    public reason: string
  ) {
    super(`Bot ${botId} failed to connect: ${reason}`);
    this.name = "MinecraftConnectionError";
  }
}

async function connectBot(botId: string, host: string, port: number) {
  try {
    const bot = createBot(botId, host, port);
    return { success: true, bot };
  } catch (error) {
    if (error instanceof Error) {
      throw new MinecraftConnectionError(botId, error.message);
    }
    throw new MinecraftConnectionError(botId, "Unknown error");
  }
}
```

---

## Documentation Requirements

- **Public functions** require JSDoc comments
- **Testing agent behavioral assumptions** must be logged in code
- **Scenario definitions** must include success criteria and expected duration
- **Architecture decisions** should be documented in ADR format (if significant)

**Example**:
```typescript
/**
 * Spawns a testing agent with a specific behavioral profile.
 *
 * @param profile - The behavioral archetype (e.g., "non-cooperator")
 * @param systemPrompt - The system prompt defining agent behavior
 * @param minecraftServer - Connection details for Minecraft server
 * @returns The spawned agent instance
 *
 * @throws {AgentSpawnError} If bot connection fails or Discord setup errors
 */
export async function spawnTestingAgent(
  profile: BehavioralProfile,
  systemPrompt: string,
  minecraftServer: { host: string; port: number }
): Promise<TestingAgent> {
  // Implementation
}
```

---

## Recommended Project Structure

```
backend/
  src/
    modules/

      testing/
        index.ts            # Elysia routes for test management
        service.ts          # Test orchestration logic
        model.ts            # Test, Scenario, TestRun types
        repository.ts       # Prisma queries for tests

      agents/
        index.ts            # Agent management routes
        coordinator.agent.ts
        testing.agent.ts
        evaluator.agent.ts
        observer.agent.ts
        model.ts            # Agent, BehavioralProfile types

      minecraft/
        index.ts            # Minecraft-related routes (optional)
        service.ts          # Mineflayer bot lifecycle management
        bot.ts              # Bot creation and command abstraction
        world.ts            # World state management
        model.ts            # MinecraftAction, BotState types

      discord/
        index.ts            # Discord integration routes (optional)
        service.ts          # Discord server/channel lifecycle
        voice.ts            # Voice channel + ElevenLabs integration
        model.ts            # DiscordMessage, VoiceEvent types

      llm/
        index.ts            # LLM provider routes (optional)
        service.ts          # LLM invocation orchestration
        adapters/
          openai.adapter.ts
          anthropic.adapter.ts
          custom.adapter.ts
        model.ts            # LLMProvider, LLMResponse types

      evaluation/
        index.ts            # Evaluation routes
        service.ts          # Metrics computation orchestration
        metrics/
          cooperation.metric.ts
          task-completion.metric.ts
          response-latency.metric.ts
        report.ts           # Report generation
        model.ts            # Metric, Report types

      realtime/
        index.ts            # WebSocket/SSE routes
        service.ts          # Event streaming orchestration
        model.ts            # DashboardEvent types

      database/
        schema.prisma       # Prisma schema
        client.ts           # Prisma client singleton
        repositories/
          test.repository.ts
          agent.repository.ts
          metric.repository.ts

    core/
      orchestration.ts      # Main test execution loop
      scenario-loader.ts    # Load scenario definitions
      types.ts              # Shared core types

    utils/
      logging/
        index.ts
      validation/
        index.ts
      ids/
        index.ts

    app.ts                  # Elysia app bootstrap
    index.ts                # Entry point

  prisma/
    schema.prisma
    migrations/

  .env
  package.json
  tsconfig.json

frontend/
  src/
    components/
      ui/                   # shadcn components
      dashboard/
        test-status-card.tsx
        llm-thinking-panel.tsx
        minecraft-world-view.tsx
        discord-chat-feed.tsx
        metrics-panel.tsx

    features/
      test-configuration/
        test-form.tsx
        scenario-selector.tsx
      test-execution/
        test-dashboard.tsx
        realtime-stream.tsx
      test-results/
        report-viewer.tsx
        metric-charts.tsx

    hooks/
      use-websocket.ts
      use-test-status.ts
      use-realtime-metrics.ts

    lib/
      api-client.ts         # Backend API client
      schemas.ts            # Zod schemas (shared with backend ideally)
      utils.ts

    pages/
      home.tsx
      test-create.tsx
      test-view.tsx
      results.tsx

    App.tsx
    main.tsx

  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.js

.env
.env.example
package.json (root)
```

---

## Environment Variables

```bash
# Backend
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/minecraft_testing
DIRECT_URL=postgresql://user:pass@localhost:5432/minecraft_testing

# Minecraft
MINECRAFT_HOST=localhost
MINECRAFT_PORT=25565

# Discord
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_guild_id

# ElevenLabs
ELEVENLABS_API_KEY=your_api_key

# LLM Providers
OPENAI_API_KEY=your_api_key
ANTHROPIC_API_KEY=your_api_key

# Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## Testing Requirements

### Unit Tests
- Test all services in isolation (mock dependencies)
- Test all Zod schemas with valid/invalid inputs
- Test metric computation functions with known inputs

### Integration Tests
- Test Elysia routes with supertest-equivalent for Bun
- Test Mineflayer bot commands with mock server
- Test Discord message flows with mock client

### End-to-End Tests
- Test full scenario execution (may require test Minecraft server)
- Validate dashboard receives correct WebSocket events
- Ensure database state is consistent after test completion

---

## Skills and Best Practices

### When to Access Skills

**Always access** `./.agents/skills/elysiajs` when:
- Creating new Elysia routes
- Implementing middleware
- Setting up plugins (CORS, Swagger, etc.)
- Handling WebSocket/SSE in Elysia
- Optimizing Elysia performance

**Always access** `./.agents/skills/vercel-react-best-practices` when:
- Creating React components
- Implementing hooks
- Managing state
- Optimizing re-renders
- Handling data fetching
- Implementing forms

**Seek documentation** when:
- Integrating Mineflayer.js (check official docs)
- Using Discord.js voice features
- Implementing ElevenLabs text-to-speech
- Configuring Prisma with Supabase

---

## Important Notes

- **Bun is the only supported runtime**
- All Minecraft server access must go through **Mineflayer abstraction**
- All Discord access must go through **Discord service layer**
- Testing agents are **first-class citizens** (not afterthoughts)
- The primary goal is **reproducible, observable LLM stress testing**
- Training or fine-tuning LLMs is **explicitly out of scope**
- Always follow **ElysiaJS and React best practices** from skills
- Always validate with **Zod at all boundaries**
- Always use **Prisma for database access** (no raw SQL unless necessary)
- Frontend must be **responsive and performant** (target 60fps for animations)
- Dashboard updates must be **real-time** (use WebSocket or SSE, not polling)

---

## Security Considerations

- **Never expose API keys** in logs, frontend code, or error messages
- **Validate all user inputs** with Zod before processing
- **Rate-limit all external API calls** (LLM providers, ElevenLabs)
- **Sanitize Discord messages** before storing or displaying
- **Use environment variables** for all credentials
- **Implement authentication** if deploying publicly (consider Supabase Auth)

---

## Performance Targets

- **API response time**: < 200ms for non-LLM routes
- **WebSocket latency**: < 100ms for dashboard updates
- **Minecraft bot action rate**: 2-5 actions per second max
- **Discord message processing**: < 50ms per message
- **Frontend TTI**: < 2 seconds on 3G
- **Dashboard FPS**: 30-60fps for animations

---

## Future Considerations

- Multi-world testing (parallel scenarios in different Minecraft worlds)
- Historical test comparison (regression detection across LLM versions)
- Custom scenario builder (UI for researchers to define new test types)
- LLM-to-LLM evaluation (agents that judge other agents)
- Video recording of Minecraft sessions (for post-test analysis)

---

**End of AGENTS.md**
