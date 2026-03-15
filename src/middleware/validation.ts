import { HttpRequest } from "@azure/functions";
import { z } from "zod";
import { validate, ValidationResult } from "./schemas";

/**
 * Extracts all query parameters from the request into a plain object,
 * then validates them against the supplied Zod schema.
 *
 * Usage:
 *   const result = validateQueryParams(request, taskQuerySchema);
 *   if (!result.success) return badRequest(formatErrors(result.errors));
 *   const { id, organizationId } = result.data;
 */
export function validateQueryParams<S extends z.ZodSchema>(
    request: HttpRequest,
    schema: S
): ValidationResult<z.infer<S>> {
    const raw: Record<string, string> = {};
    request.query.forEach((value, key) => {
        raw[key] = value;
    });
    return validate(schema, raw);
}

/**
 * Reads the request body as JSON.
 * Throws a ValidationError if the body is absent or not parseable.
 * Body shape validation is handled separately via `validate(schema, body)`.
 */
export async function parseJsonBody(request: HttpRequest): Promise<unknown> {
    try {
        const body = await request.json();
        if (body === null || body === undefined) {
            throw new ValidationError("Request body must not be empty.");
        }
        return body;
    } catch (err) {
        if (err instanceof ValidationError) throw err;
        throw new ValidationError("Request body must be valid JSON.");
    }
}

/**
 * Formats a Zod error array into a single string suitable for a 400 response body.
 * Each error is on its own line so clients can parse them easily.
 */
export function formatErrors(errors: string[]): string {
    return errors.join("; ");
}

/** Sentinel error class used to signal a client-facing validation failure. */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}