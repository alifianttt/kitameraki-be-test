import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { validateQueryParams, formatErrors } from "../middleware/validation";
import { ok, badRequest, withErrorHandler } from "../middleware/response";
import { orgQuerySchema } from "../middleware/schemas";
import { listTasks } from "../services/taskServices";

async function handler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`GetTasks — ${request.url}`);

    const query = validateQueryParams(request, orgQuerySchema);
    if (!query.success) return badRequest(formatErrors(query.errors));

    const tasks = await listTasks(query.data.organizationId);
    return ok(tasks);
}

app.http("GetTasks", {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: withErrorHandler(handler),
});