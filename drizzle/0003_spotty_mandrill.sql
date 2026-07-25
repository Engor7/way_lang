CREATE TABLE "exam_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"plan" jsonb NOT NULL,
	"stage_results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"percent" integer,
	"grade" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "item_progress" (
	"user_id" integer NOT NULL,
	"course_id" text NOT NULL,
	"item_id" text NOT NULL,
	"stage" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"wrong" integer DEFAULT 0 NOT NULL,
	"learned_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_progress_user_id_course_id_item_id_pk" PRIMARY KEY("user_id","course_id","item_id")
);
--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_progress" ADD CONSTRAINT "item_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;