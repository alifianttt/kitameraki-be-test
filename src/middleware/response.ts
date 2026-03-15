import { HttpResponseInit } from "@azure/functions";

/** Standard JSON success response */
export function ok(body?: unknown): HttpResponseInit {
    return { status: 200, jsonBody: body ?? null };
}

/** 201 Created */
export function created(body: unknown): HttpResponseInit {
    return { status: 201, jsonBody: body };
}

/** 400 Bad Request */
export function badRequest(message: string): HttpResponseInit {
    return { status: 400, jsonBody: { error: message } };
}

/** 404 Not Found */
export function notFound(message = "Resource not found"): HttpResponseInit {
    return { status: 404, jsonBody: { error: message } };
}

/** 500 Internal Server Error — never leaks raw error details to the client */
export function internalError(err: unknown): HttpResponseInit {
    console.error("[Unhandled error]", err);
    return { status: 500, jsonBody: { error: "An unexpected error occurred." } };
}

/**
 * Wraps an async function handler so that any unhandled rejection is caught
 * and returned as a structured 500 response instead of crashing the function.
 */
export function withErrorHandler<T extends unknown[]>(
    fn: (...args: T) => Promise<HttpResponseInit>
): (...args: T) => Promise<HttpResponseInit> {
    return async (...args: T) => {
        try {
            return await fn(...args);
        } catch (err) {
            return internalError(err);
        }
    };
}