import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { validateQueryParams, formatErrors } from "../middleware/validation";
import { ok, badRequest, notFound, withErrorHandler } from "../middleware/response";
import { taskQuerySchema } from "../middleware/schemas";
import { getTask } from "../services/taskServices";

async function handler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`GetTask — ${request.url}`);

    const query = validateQueryParams(request, taskQuerySchema);
    if (!query.success) return badRequest(formatErrors(query.errors));

    const task = await getTask(query.data.id, query.data.organizationId);
    if (!task) return notFound(`Task '${query.data.id}' not found.`);

    return ok(task);
}

app.http("GetTask", {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: withErrorHandler(handler),
});