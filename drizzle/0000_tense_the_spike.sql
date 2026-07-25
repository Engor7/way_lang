CREATE TABLE "words" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"translation" text NOT NULL,
	"example" text,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
