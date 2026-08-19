-- Drop old tables from previous schema (safe for dev environment)
DROP TABLE IF EXISTS "chat_message" CASCADE;
DROP TABLE IF EXISTS "file" CASCADE;
DROP TABLE IF EXISTS "project" CASCADE;
DROP TABLE IF EXISTS "workspace" CASCADE;
DROP TABLE IF EXISTS "agent_conversation" CASCADE;
DROP TABLE IF EXISTS "agent" CASCADE;
DROP TABLE IF EXISTS "mcp_server" CASCADE;
DROP TABLE IF EXISTS "design_project" CASCADE;
DROP TABLE IF EXISTS "video_project" CASCADE;
DROP TABLE IF EXISTS "workflow" CASCADE;
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Drop old enums if they exist
DROP TYPE IF EXISTS "project_status" CASCADE;
DROP TYPE IF EXISTS "project_type" CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE "public"."project_type" AS ENUM('code', 'design', 'video', 'flow');
CREATE TYPE "public"."project_status" AS ENUM('active', 'archived', 'deleted');
CREATE TYPE "public"."agent_role" AS ENUM('coder', 'designer', 'video', 'orchestrator', 'general');
CREATE TYPE "public"."conversation_status" AS ENUM('active', 'archived');
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system', 'tool');
CREATE TYPE "public"."mcp_transport" AS ENUM('stdio', 'sse', 'streamable_http');
CREATE TYPE "public"."mcp_server_status" AS ENUM('active', 'inactive', 'error');
CREATE TYPE "public"."tool_invocation_status" AS ENUM('pending', 'running', 'success', 'error', 'denied');
CREATE TYPE "public"."workflow_status" AS ENUM('draft', 'active', 'archived');
CREATE TYPE "public"."workflow_run_status" AS ENUM('pending', 'running', 'success', 'failed', 'cancelled');
CREATE TYPE "public"."acp_message_type" AS ENUM('task_assign', 'task_complete', 'data_transfer', 'status_update', 'error_report');
CREATE TYPE "public"."acp_message_status" AS ENUM('sent', 'delivered', 'processed', 'failed');

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUTH TABLES (Better Auth)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" boolean DEFAULT false,
	"image" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp,
	"token" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);

CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text,
	"provider_id" text,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text,
	"value" text,
	"expires_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROJECTS (unified)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "project_type" NOT NULL,
	"status" "project_status" DEFAULT 'active',
	"thumbnail_url" text,
	"git_url" text,
	"git_branch" text DEFAULT 'main',
	"sandbox_id" text,
	"template" text DEFAULT 'blank',
	"config" text DEFAULT '{}',
	"tags" text DEFAULT '[]',
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROJECT DETAIL TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "code_project" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"framework" text,
	"language" text,
	"package_manager" text DEFAULT 'pnpm',
	"repo_branch" text DEFAULT 'main',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "code_project_project_id_unique" UNIQUE("project_id")
);

CREATE TABLE "design_project" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"canvas_width" integer DEFAULT 1920,
	"canvas_height" integer DEFAULT 1080,
	"canvas_data" text DEFAULT '{}',
	"layers" text DEFAULT '[]',
	"artboard_color" text DEFAULT '#ffffff',
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "design_project_project_id_unique" UNIQUE("project_id")
);

CREATE TABLE "video_project" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"composition" text DEFAULT '{}',
	"timeline" text DEFAULT '[]',
	"duration" integer DEFAULT 30,
	"fps" integer DEFAULT 30,
	"resolution" text DEFAULT '1920x1080',
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "video_project_project_id_unique" UNIQUE("project_id")
);

CREATE TABLE "workflow_detail" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"nodes" text DEFAULT '[]',
	"edges" text DEFAULT '[]',
	"variables" text DEFAULT '{}',
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "workflow_detail_project_id_unique" UNIQUE("project_id")
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FILES & ASSETS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "file" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"path" text NOT NULL,
	"content" text,
	"language" text,
	"size_bytes" integer,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "asset" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"mime_type" text,
	"url" text NOT NULL,
	"size_bytes" integer,
	"metadata" text DEFAULT '{}',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AGENTS & CONVERSATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "agent" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"role" "agent_role" DEFAULT 'general' NOT NULL,
	"model" text DEFAULT 'openrouter/free' NOT NULL,
	"system_prompt" text,
	"temperature" integer DEFAULT 70,
	"max_tokens" integer DEFAULT 4096,
	"tools" text DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "agent_project" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"agent_id" text,
	"title" text,
	"status" "conversation_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"parent_message_id" text,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"tool_calls" text,
	"tool_result_id" text,
	"model" text,
	"token_usage" integer,
	"cost_micros" integer,
	"metadata" text DEFAULT '{}',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MCP & TOOL SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "mcp_server" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"transport" "mcp_transport" DEFAULT 'stdio',
	"status" "mcp_server_status" DEFAULT 'active',
	"last_connected_at" timestamp,
	"config" text DEFAULT '{}',
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "mcp_tool" (
	"id" text PRIMARY KEY NOT NULL,
	"server_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"input_schema" text,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "tool_invocation" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text,
	"message_id" text,
	"tool_name" text NOT NULL,
	"server_id" text,
	"input" text DEFAULT '{}',
	"output" text,
	"status" "tool_invocation_status" DEFAULT 'pending',
	"error_message" text,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- WORKFLOWS (with execution tracking)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "workflow" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"nodes" text DEFAULT '[]',
	"edges" text DEFAULT '[]',
	"variables" text DEFAULT '{}',
	"is_template" boolean DEFAULT false,
	"template_category" text,
	"version" integer DEFAULT 1,
	"status" "workflow_status" DEFAULT 'draft',
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "workflow_run" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"status" "workflow_run_status" DEFAULT 'running',
	"input" text DEFAULT '{}',
	"output" text,
	"error" text,
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"completed_at" timestamp,
	"duration_ms" integer,
	"user_id" text NOT NULL
);

CREATE TABLE "workflow_run_step" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"node_id" text NOT NULL,
	"node_type" varchar(50) NOT NULL,
	"status" "workflow_run_status" DEFAULT 'pending',
	"input" text DEFAULT '{}',
	"output" text,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_ms" integer
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACP (Agent Communication Protocol)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "acp_message" (
	"id" text PRIMARY KEY NOT NULL,
	"from_agent_id" text NOT NULL,
	"to_agent_id" text,
	"project_id" text,
	"type" "acp_message_type" NOT NULL,
	"payload" text DEFAULT '{}',
	"status" "acp_message_status" DEFAULT 'sent',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- USAGE & ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "token_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0,
	"output_tokens" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"cost_micros" integer DEFAULT 0,
	"period" varchar(7) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FOREIGN KEYS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "code_project" ADD CONSTRAINT "code_project_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "design_project" ADD CONSTRAINT "design_project_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "video_project" ADD CONSTRAINT "video_project_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflow_detail" ADD CONSTRAINT "workflow_detail_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "file" ADD CONSTRAINT "file_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "file" ADD CONSTRAINT "file_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "asset" ADD CONSTRAINT "asset_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent" ADD CONSTRAINT "agent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_project" ADD CONSTRAINT "agent_project_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_project" ADD CONSTRAINT "agent_project_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "mcp_server" ADD CONSTRAINT "mcp_server_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "mcp_tool" ADD CONSTRAINT "mcp_tool_server_id_mcp_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mcp_server"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tool_invocation" ADD CONSTRAINT "tool_invocation_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "tool_invocation" ADD CONSTRAINT "tool_invocation_message_id_chat_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_message"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "tool_invocation" ADD CONSTRAINT "tool_invocation_server_id_mcp_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."mcp_server"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflow_run" ADD CONSTRAINT "workflow_run_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflow_run" ADD CONSTRAINT "workflow_run_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workflow_run_step" ADD CONSTRAINT "workflow_run_step_run_id_workflow_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."workflow_run"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "acp_message" ADD CONSTRAINT "acp_message_from_agent_id_agent_id_fk" FOREIGN KEY ("from_agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "acp_message" ADD CONSTRAINT "acp_message_to_agent_id_agent_id_fk" FOREIGN KEY ("to_agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "acp_message" ADD CONSTRAINT "acp_message_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX "email_idx" ON "user" USING btree ("email");
CREATE INDEX "user_id_idx" ON "session" USING btree ("user_id");
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");
CREATE INDEX "provider_idx" ON "account" USING btree ("provider_id");
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
CREATE INDEX "project_user_id_idx" ON "project" USING btree ("user_id");
CREATE INDEX "project_type_idx" ON "project" USING btree ("type");
CREATE INDEX "project_status_idx" ON "project" USING btree ("status");
CREATE INDEX "file_project_id_idx" ON "file" USING btree ("project_id");
CREATE INDEX "file_path_idx" ON "file" USING btree ("path");
CREATE INDEX "file_user_id_idx" ON "file" USING btree ("user_id");
CREATE INDEX "asset_project_id_idx" ON "asset" USING btree ("project_id");
CREATE INDEX "asset_type_idx" ON "asset" USING btree ("type");
CREATE INDEX "agent_user_id_idx" ON "agent" USING btree ("user_id");
CREATE INDEX "agent_role_idx" ON "agent" USING btree ("role");
CREATE INDEX "agent_project_agent_idx" ON "agent_project" USING btree ("agent_id");
CREATE INDEX "agent_project_project_idx" ON "agent_project" USING btree ("project_id");
CREATE INDEX "conversation_project_idx" ON "conversation" USING btree ("project_id");
CREATE INDEX "conversation_agent_idx" ON "conversation" USING btree ("agent_id");
CREATE INDEX "chat_msg_conversation_idx" ON "chat_message" USING btree ("conversation_id");
CREATE INDEX "chat_msg_parent_idx" ON "chat_message" USING btree ("parent_message_id");
CREATE INDEX "chat_msg_role_idx" ON "chat_message" USING btree ("role");
CREATE INDEX "chat_msg_created_idx" ON "chat_message" USING btree ("created_at");
CREATE INDEX "mcp_server_user_idx" ON "mcp_server" USING btree ("user_id");
CREATE INDEX "mcp_server_status_idx" ON "mcp_server" USING btree ("status");
CREATE INDEX "mcp_tool_server_idx" ON "mcp_tool" USING btree ("server_id");
CREATE INDEX "mcp_tool_name_idx" ON "mcp_tool" USING btree ("name");
CREATE INDEX "tool_inv_conversation_idx" ON "tool_invocation" USING btree ("conversation_id");
CREATE INDEX "tool_inv_tool_name_idx" ON "tool_invocation" USING btree ("tool_name");
CREATE INDEX "tool_inv_status_idx" ON "tool_invocation" USING btree ("status");
CREATE INDEX "workflow_user_idx" ON "workflow" USING btree ("user_id");
CREATE INDEX "workflow_template_idx" ON "workflow" USING btree ("is_template");
CREATE INDEX "workflow_status_idx" ON "workflow" USING btree ("status");
CREATE INDEX "wf_run_workflow_idx" ON "workflow_run" USING btree ("workflow_id");
CREATE INDEX "wf_run_status_idx" ON "workflow_run" USING btree ("status");
CREATE INDEX "wf_run_started_idx" ON "workflow_run" USING btree ("started_at");
CREATE INDEX "wf_step_run_idx" ON "workflow_run_step" USING btree ("run_id");
CREATE INDEX "wf_step_node_idx" ON "workflow_run_step" USING btree ("node_id");
CREATE INDEX "wf_step_status_idx" ON "workflow_run_step" USING btree ("status");
CREATE INDEX "acp_msg_from_idx" ON "acp_message" USING btree ("from_agent_id");
CREATE INDEX "acp_msg_to_idx" ON "acp_message" USING btree ("to_agent_id");
CREATE INDEX "acp_msg_project_idx" ON "acp_message" USING btree ("project_id");
CREATE INDEX "acp_msg_type_idx" ON "acp_message" USING btree ("type");
CREATE INDEX "token_usage_user_idx" ON "token_usage" USING btree ("user_id");
CREATE INDEX "token_usage_project_idx" ON "token_usage" USING btree ("project_id");
CREATE INDEX "token_usage_period_idx" ON "token_usage" USING btree ("period");
CREATE INDEX "token_usage_user_model_period_idx" ON "token_usage" USING btree ("user_id","model","period");
