import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export const projectTypeEnum = pgEnum("project_type", [
  "code",
  "design",
  "video",
  "flow",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "archived",
  "deleted",
]);

export const agentRoleEnum = pgEnum("agent_role", [
  "coder",
  "designer",
  "video",
  "orchestrator",
  "general",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "archived",
]);

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
  "tool",
]);

export const mcpTransportEnum = pgEnum("mcp_transport", [
  "stdio",
  "sse",
  "streamable_http",
]);

export const mcpServerStatusEnum = pgEnum("mcp_server_status", [
  "active",
  "inactive",
  "error",
]);

export const toolInvocationStatusEnum = pgEnum("tool_invocation_status", [
  "pending",
  "running",
  "success",
  "error",
  "denied",
]);

export const workflowStatusEnum = pgEnum("workflow_status", [
  "draft",
  "active",
  "archived",
]);

export const workflowRunStatusEnum = pgEnum("workflow_run_status", [
  "pending",
  "running",
  "success",
  "failed",
  "cancelled",
]);

export const acpMessageTypeEnum = pgEnum("acp_message_type", [
  "task_assign",
  "task_complete",
  "data_transfer",
  "status_update",
  "error_report",
]);

export const acpMessageStatusEnum = pgEnum("acp_message_status", [
  "sent",
  "delivered",
  "processed",
  "failed",
]);

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH TABLES (Better Auth — keep as-is)
// ═══════════════════════════════════════════════════════════════════════════════

export const userTable = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: boolean("email_verified").default(false),
    image: text("image"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
  })
);

export const sessionTable = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at"),
    token: text("token").unique(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

export const accountTable = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id"),
    providerId: text("provider_id"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdIdx: index("account_user_id_idx").on(table.userId),
    providerIdx: index("provider_idx").on(table.providerId),
  })
);

export const verificationTable = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier"),
    value: text("value"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS (unified — one table for all workspace types)
// ═══════════════════════════════════════════════════════════════════════════════

export const projectTable = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    type: projectTypeEnum("type").notNull(),
    status: projectStatusEnum("status").default("active"),
    thumbnailUrl: text("thumbnail_url"),
    gitUrl: text("git_url"),
    gitBranch: text("git_branch").default("main"),
    sandboxId: text("sandbox_id"),
    template: text("template").default("blank"),
    config: text("config").default("{}"), // JSON — type-specific settings
    tags: text("tags").default("[]"), // JSON array of strings
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdIdx: index("project_user_id_idx").on(table.userId),
    typeIdx: index("project_type_idx").on(table.type),
    statusIdx: index("project_status_idx").on(table.status),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT DETAIL TABLES (type-specific 1:1 extensions)
// ═══════════════════════════════════════════════════════════════════════════════

export const codeProjectTable = pgTable(
  "code_project",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" })
      .unique(),
    framework: text("framework"), // e.g. "nextjs", "vite", "remix"
    language: text("language"), // e.g. "typescript", "python"
    packageManager: text("package_manager").default("pnpm"),
    repoBranch: text("repo_branch").default("main"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  }
);

export const designProjectTable = pgTable(
  "design_project",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" })
      .unique(),
    canvasWidth: integer("canvas_width").default(1920),
    canvasHeight: integer("canvas_height").default(1080),
    canvasData: text("canvas_data").default("{}"), // JSON — PixiJS scene graph
    layers: text("layers").default("[]"), // JSON — layer definitions
    artboardColor: text("artboard_color").default("#ffffff"),
    version: integer("version").default(1),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  }
);

export const videoProjectTable = pgTable(
  "video_project",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" })
      .unique(),
    composition: text("composition").default("{}"), // JSON — Remotion composition
    timeline: text("timeline").default("[]"), // JSON — track definitions
    duration: integer("duration").default(30), // seconds
    fps: integer("fps").default(30),
    resolution: text("resolution").default("1920x1080"),
    version: integer("version").default(1),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  }
);

export const workflowDetailTable = pgTable(
  "workflow_detail",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" })
      .unique(),
    nodes: text("nodes").default("[]"), // JSON — node definitions
    edges: text("edges").default("[]"), // JSON — edge definitions
    variables: text("variables").default("{}"), // JSON — workflow variables
    version: integer("version").default(1),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// FILES & ASSETS
// ═══════════════════════════════════════════════════════════════════════════════

export const fileTable = pgTable(
  "file",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    content: text("content"),
    language: text("language"), // detected language for highlighting
    sizeBytes: integer("size_bytes"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index("file_project_id_idx").on(table.projectId),
    pathIdx: index("file_path_idx").on(table.path),
    userIdx: index("file_user_id_idx").on(table.userId),
  })
);

export const assetTable = pgTable(
  "asset",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'image' | 'video' | 'audio' | 'font' | 'export'
    mimeType: text("mime_type"),
    url: text("url").notNull(), // storage URL / data URI
    sizeBytes: integer("size_bytes"),
    metadata: text("metadata").default("{}"), // JSON — dimensions, duration, etc.
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index("asset_project_id_idx").on(table.projectId),
    typeIdx: index("asset_type_idx").on(table.type),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// AGENTS & CONVERSATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const agentTable = pgTable(
  "agent",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    role: agentRoleEnum("role").notNull().default("general"),
    model: text("model").notNull().default("openrouter/free"),
    systemPrompt: text("system_prompt"),
    temperature: integer("temperature").default(70), // 0-100, maps to 0.0-1.0
    maxTokens: integer("max_tokens").default(4096),
    tools: text("tools").default("[]"), // JSON — tool name array
    isActive: boolean("is_active").default(true),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("agent_user_id_idx").on(table.userId),
    roleIdx: index("agent_role_idx").on(table.role),
  })
);

// Agent ↔ Project association (many-to-many)
export const agentProjectTable = pgTable(
  "agent_project",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agentTable.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    agentIdIdx: index("agent_project_agent_idx").on(table.agentId),
    projectIdIdx: index("agent_project_project_idx").on(table.projectId),
  })
);

// Conversations (threaded chat sessions)
export const conversationTable = pgTable(
  "conversation",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    agentId: text("agent_id").references(() => agentTable.id, {
      onDelete: "set null",
    }),
    title: text("title"),
    status: conversationStatusEnum("status").default("active"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index("conversation_project_idx").on(table.projectId),
    agentIdIdx: index("conversation_agent_idx").on(table.agentId),
  })
);

// Chat Messages (enhanced with threading, tool calls, token tracking)
export const chatMessageTable = pgTable(
  "chat_message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversationTable.id, { onDelete: "cascade" }),
    parentMessageId: text("parent_message_id"), // for threading / tool-call results
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    toolCalls: text("tool_calls"), // JSON — array of tool call objects
    toolResultId: text("tool_result_id"), // links tool result back to its call
    model: text("model"), // which model generated this
    tokenUsage: integer("token_usage"), // total tokens for this message
    costMicros: integer("cost_micros"), // cost in micro-cents
    metadata: text("metadata").default("{}"), // JSON — extra info
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    conversationIdx: index("chat_msg_conversation_idx").on(table.conversationId),
    parentIdx: index("chat_msg_parent_idx").on(table.parentMessageId),
    roleIdx: index("chat_msg_role_idx").on(table.role),
    createdAtIdx: index("chat_msg_created_idx").on(table.createdAt),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// MCP & TOOL SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const mcpServerTable = pgTable(
  "mcp_server",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    transport: mcpTransportEnum("transport").default("stdio"),
    status: mcpServerStatusEnum("status").default("active"),
    lastConnectedAt: timestamp("last_connected_at"),
    config: text("config").default("{}"), // JSON — transport-specific config
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("mcp_server_user_idx").on(table.userId),
    statusIdx: index("mcp_server_status_idx").on(table.status),
  })
);

// MCP Tools (discovered from servers)
export const mcpToolTable = pgTable(
  "mcp_tool",
  {
    id: text("id").primaryKey(),
    serverId: text("server_id")
      .notNull()
      .references(() => mcpServerTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    inputSchema: text("input_schema"), // JSON Schema for tool inputs
    isEnabled: boolean("is_enabled").default(true),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    serverIdIdx: index("mcp_tool_server_idx").on(table.serverId),
    nameIdx: index("mcp_tool_name_idx").on(table.name),
  })
);

// Tool Invocations (audit log)
export const toolInvocationTable = pgTable(
  "tool_invocation",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").references(
      () => conversationTable.id,
      { onDelete: "set null" }
    ),
    messageId: text("message_id").references(() => chatMessageTable.id, {
      onDelete: "set null",
    }),
    toolName: text("tool_name").notNull(),
    serverId: text("server_id").references(() => mcpServerTable.id, {
      onDelete: "set null",
    }),
    input: text("input").default("{}"), // JSON — tool arguments
    output: text("output"), // JSON — tool result
    status: toolInvocationStatusEnum("status").default("pending"),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    conversationIdx: index("tool_inv_conversation_idx").on(table.conversationId),
    toolNameIdx: index("tool_inv_tool_name_idx").on(table.toolName),
    statusIdx: index("tool_inv_status_idx").on(table.status),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOWS (with execution tracking)
// ═══════════════════════════════════════════════════════════════════════════════

export const workflowTable = pgTable(
  "workflow",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    nodes: text("nodes").default("[]"), // JSON — node definitions
    edges: text("edges").default("[]"), // JSON — edge definitions
    variables: text("variables").default("{}"), // JSON — input variables
    isTemplate: boolean("is_template").default(false),
    templateCategory: text("template_category"), // 'coding' | 'design' | 'video' | 'general'
    version: integer("version").default(1),
    status: workflowStatusEnum("status").default("draft"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("workflow_user_idx").on(table.userId),
    isTemplateIdx: index("workflow_template_idx").on(table.isTemplate),
    statusIdx: index("workflow_status_idx").on(table.status),
  })
);

// Workflow Runs (execution history)
export const workflowRunTable = pgTable(
  "workflow_run",
  {
    id: text("id").primaryKey(),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflowTable.id, { onDelete: "cascade" }),
    status: workflowRunStatusEnum("status").default("running"),
    input: text("input").default("{}"), // JSON — runtime inputs
    output: text("output"), // JSON — final output
    error: text("error"), // error message if failed
    startedAt: timestamp("started_at").default(sql`CURRENT_TIMESTAMP`),
    completedAt: timestamp("completed_at"),
    durationMs: integer("duration_ms"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    workflowIdx: index("wf_run_workflow_idx").on(table.workflowId),
    statusIdx: index("wf_run_status_idx").on(table.status),
    startedAtIdx: index("wf_run_started_idx").on(table.startedAt),
  })
);

// Workflow Run Steps (per-node execution)
export const workflowRunStepTable = pgTable(
  "workflow_run_step",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => workflowRunTable.id, { onDelete: "cascade" }),
    nodeId: text("node_id").notNull(), // references node in workflow JSON
    nodeType: varchar("node_type", { length: 50 }).notNull(), // 'agent' | 'tool' | 'input' | 'output' | 'condition' | 'loop'
    status: workflowRunStatusEnum("status").default("pending"),
    input: text("input").default("{}"),
    output: text("output"),
    error: text("error"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    durationMs: integer("duration_ms"),
  },
  (table) => ({
    runIdx: index("wf_step_run_idx").on(table.runId),
    nodeIdIdx: index("wf_step_node_idx").on(table.nodeId),
    statusIdx: index("wf_step_status_idx").on(table.status),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// ACP (Agent Communication Protocol)
// ═══════════════════════════════════════════════════════════════════════════════

export const acpMessageTable = pgTable(
  "acp_message",
  {
    id: text("id").primaryKey(),
    fromAgentId: text("from_agent_id")
      .notNull()
      .references(() => agentTable.id, { onDelete: "cascade" }),
    toAgentId: text("to_agent_id").references(() => agentTable.id, {
      onDelete: "cascade",
    }),
    projectId: text("project_id").references(() => projectTable.id, {
      onDelete: "cascade",
    }),
    type: acpMessageTypeEnum("type").notNull(),
    payload: text("payload").default("{}"), // JSON — message body
    status: acpMessageStatusEnum("status").default("sent"),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    fromIdx: index("acp_msg_from_idx").on(table.fromAgentId),
    toIdx: index("acp_msg_to_idx").on(table.toAgentId),
    projectIdx: index("acp_msg_project_idx").on(table.projectId),
    typeIdx: index("acp_msg_type_idx").on(table.type),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

export const tokenUsageTable = pgTable(
  "token_usage",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projectTable.id, {
      onDelete: "set null",
    }),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").default(0),
    outputTokens: integer("output_tokens").default(0),
    totalTokens: integer("total_tokens").default(0),
    costMicros: integer("cost_micros").default(0),
    period: varchar("period", { length: 7 }).notNull(), // 'YYYY-MM'
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("token_usage_user_idx").on(table.userId),
    projectIdx: index("token_usage_project_idx").on(table.projectId),
    periodIdx: index("token_usage_period_idx").on(table.period),
    userModelPeriodIdx: index("token_usage_user_model_period_idx").on(
      table.userId,
      table.model,
      table.period
    ),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type User = typeof userTable.$inferSelect;
export type Session = typeof sessionTable.$inferSelect;
export type Account = typeof accountTable.$inferSelect;
export type Project = typeof projectTable.$inferSelect;
export type CodeProject = typeof codeProjectTable.$inferSelect;
export type DesignProject = typeof designProjectTable.$inferSelect;
export type VideoProject = typeof videoProjectTable.$inferSelect;
export type WorkflowDetail = typeof workflowDetailTable.$inferSelect;
export type File = typeof fileTable.$inferSelect;
export type Asset = typeof assetTable.$inferSelect;
export type Agent = typeof agentTable.$inferSelect;
export type AgentProject = typeof agentProjectTable.$inferSelect;
export type Conversation = typeof conversationTable.$inferSelect;
export type ChatMessage = typeof chatMessageTable.$inferSelect;
export type McpServer = typeof mcpServerTable.$inferSelect;
export type McpTool = typeof mcpToolTable.$inferSelect;
export type ToolInvocation = typeof toolInvocationTable.$inferSelect;
export type Workflow = typeof workflowTable.$inferSelect;
export type WorkflowRun = typeof workflowRunTable.$inferSelect;
export type WorkflowRunStep = typeof workflowRunStepTable.$inferSelect;
export type AcpMessage = typeof acpMessageTable.$inferSelect;
export type TokenUsage = typeof tokenUsageTable.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// BACKWARD-COMPATIBLE ALIASES
// ═══════════════════════════════════════════════════════════════════════════════

export const projects = projectTable;
export const files = fileTable;
export const chatMessages = chatMessageTable;
export const agents = agentTable;
export const agentProjects = agentProjectTable;
export const conversations = conversationTable;
export const mcpServers = mcpServerTable;
export const mcpTools = mcpToolTable;
export const toolInvocations = toolInvocationTable;
export const workflows = workflowTable;
export const workflowRuns = workflowRunTable;
export const workflowRunSteps = workflowRunStepTable;
export const acpMessages = acpMessageTable;
export const tokenUsages = tokenUsageTable;
