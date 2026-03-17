import { HttpResponseInit } from "@azure/functions";

export function ok(body?: unknown): HttpResponseInit {
    return { status: 200, jsonBody: body ?? null };
}

export function created(body: unknown): HttpResponseInit {
    return { status: 201, jsonBody: body };
}

export function badRequest(message: string): HttpResponseInit {
    return { status: 400, jsonBody: { error: message } };
}

export function notFound(message = "Resource not found"): HttpResponseInit {
    return { status: 404, jsonBody: { error: message } };
}

export function internalError(err: unknown): HttpResponseInit {
    console.error("[Unhandled error]", err);
    return { status: 500, jsonBody: { error: "An unexpected error occurred." } };
}

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