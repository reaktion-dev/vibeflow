-- Project budget ledger table
CREATE TABLE IF NOT EXISTS "project_budget" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "budget_cents" integer NOT NULL,
  "spent_cents" integer DEFAULT 0,
  "over_budget" boolean DEFAULT false,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: one budget per project
ALTER TABLE "project_budget" ADD CONSTRAINT "project_budget_project_id_unique" UNIQUE ("project_id");

-- Foreign key to project with cascade delete
ALTER TABLE "project_budget" ADD CONSTRAINT "project_budget_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;

-- Index for project_id lookups
CREATE INDEX IF NOT EXISTS "project_budget_project_idx" ON "project_budget" ("project_id");
