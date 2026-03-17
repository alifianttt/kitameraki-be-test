import { z } from "zod";

// ─── Reusable primitives ───────────────────────────────────────────────────────

const uuidField = (label: string) =>
    z.string().uuid({ message: `${label} must be a valid UUID` });

const prioritySchema = z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "priority must be 'low', 'medium', or 'high'" }),
});

const statusSchema = z.enum(["todo", "in-progress", "completed"], {
    errorMap: () => ({ message: "status must be 'todo', 'in-progress', or 'completed'" }),
});

// ─── Task body schemas ─────────────────────────────────────────────────────────

/**
 * POST /InsertTask — body validation.
 * `id` is server-generated; all other required fields must be present.
 */
export const createTaskSchema = z.object({
    organizationId: uuidField("organizationId"),
    title:          z.string().min(1, "title must not be empty").max(100, "title must be 100 characters or fewer"),
    description:    z.string().max(1000, "description must be 1000 characters or fewer").optional(),
    dueDate:        z.string().datetime({ message: "dueDate must be a valid ISO 8601 date-time string" }).optional(),
    priority:       prioritySchema.optional(),
    status:         statusSchema,
    tags:           z.array(z.string().max(50, "each tag must be 50 characters or fewer")).optional(),
    customFields:   z.record(z.string(), z.string()).optional()
});

/**
 * PATCH /UpdateTask — body validation.
 * All fields are optional; at least one must be present.
 * `id` and `organizationId` are immutable and may not be patched.
 */
export const updateTaskSchema = z
    .object({
        title:       z.string().min(1, "title must not be empty").max(100).optional(),
        description: z.string().max(1000).optional(),
        dueDate:     z.string().datetime({ message: "dueDate must be a valid ISO 8601 date-time string" }).optional(),
        priority:    prioritySchema.optional(),
        status:      statusSchema.optional(),
        tags:        z.array(z.string().max(50)).optional(),
        customFields:   z.record(z.string(), z.string()).optional()
    })
    .strict()   // reject unknown keys (e.g. accidental `id` or `organizationId` in body)
    .refine(
        (data) => Object.keys(data).length > 0,
        { message: "Request body must contain at least one field to update." }
    );

/**
 * DELETE /BulkDeleteTasks — body validation.
 * Expects a non-empty array of UUID strings.
 */
export const bulkDeleteBodySchema = z
    .array(uuidField("each task id"), { invalid_type_error: "Body must be an array of task UUIDs." })
    .min(1, "Body must contain at least one task ID.");

// ─── FormSettings body schemas ────────────────────────────────────────────────

/**
 * POST /UpsertFormSettings — body validation.
 */
export const upsertFormSettingsSchema = z.object({
    settings: z
        .record(z.string(), z.unknown(), { invalid_type_error: "'settings' must be a plain object." })
        .refine(
            (s) => Object.keys(s).length > 0,
            { message: "'settings' object must not be empty." }
        ),
});

// ─── Query-parameter schemas ──────────────────────────────────────────────────

/**
 * Shared query params for routes that only need ?organizationId=
 */
export const orgQuerySchema = z.object({
    organizationId: uuidField("organizationId"),
});

/**
 * Query params for routes that need both ?id= and ?organizationId=
 */
export const taskQuerySchema = z.object({
    id:             uuidField("id"),
    organizationId: uuidField("organizationId"),
});

// ─── Inferred TypeScript types ────────────────────────────────────────────────
// Derive types from schemas so there is a single source of truth.

export type CreateTaskBody         = z.infer<typeof createTaskSchema>;
export type UpdateTaskBody         = z.infer<typeof updateTaskSchema>;
export type BulkDeleteBody         = z.infer<typeof bulkDeleteBodySchema>;
export type UpsertFormSettingsBody = z.infer<typeof upsertFormSettingsSchema>;
export type OrgQuery               = z.infer<typeof orgQuerySchema>;
export type TaskQuery              = z.infer<typeof taskQuerySchema>;

// ─── Validation helper ────────────────────────────────────────────────────────

export type ValidationResult<T> =
     | { success: true; data: T; errors?: never }
    | { success: false; errors: string[]; data?: never };

/**
 * Runs `schema.safeParse(input)` and returns either the strongly-typed data
 * or a flat list of human-readable error strings (one per failing field).
 *
 * Error format: `"field.path: message"` — e.g. `"tags.0: each tag must be 50 characters or fewer"`
 */
export function validate<S extends z.ZodSchema>(
    schema: S,
    input: unknown
): ValidationResult<z.infer<S>> {
    const result = schema.safeParse(input);
    if (result.success) {
        return { success: true as const, data: result.data as z.infer<S> };
    }
    const errors = result.error.errors.map(
        (issue) => `${issue.path.length ? issue.path.join(".") : "body"}: ${issue.message}`
    );
    return { success: false as const, errors };
}

/**
 * Convenience wrapper: validates query params passed as a plain object
 * (assembled from `request.query`).
 */
export function validateQuery<S extends z.ZodSchema>(
    schema: S,
    params: Record<string, string | undefined>
): ValidationResult<z.infer<S>> {
    return validate(schema, params);
}