import { HttpRequest } from "@azure/functions";
import { z } from "zod";
import { validate, ValidationResult } from "./schemas";


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


export function formatErrors(errors: string[]): string {
    return errors.join("; ");
}


export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}