import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { validateQueryParams, parseJsonBody, formatErrors } from "../middleware/validation";
import { ok, badRequest, withErrorHandler } from "../middleware/response";
import { taskQuerySchema, updateTaskSchema, validate } from "../middleware/schemas";
import { updateTask } from "../services/taskServices";

async function handler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`UpdateTask — ${request.url}`);

    const query = validateQueryParams(request, taskQuerySchema);
    if (!query.success) return badRequest(formatErrors(query.errors));

    const raw = await parseJsonBody(request);

    const body = validate(updateTaskSchema, raw);
    if (!body.success) return badRequest(formatErrors(body.errors));

    const task = await updateTask(query.data.id, query.data.organizationId, body.data);
    return ok(task);
}

app.http("UpdateTask", {
    methods: ["PATCH"],
    authLevel: "anonymous",
    handler: withErrorHandler(handler),
});