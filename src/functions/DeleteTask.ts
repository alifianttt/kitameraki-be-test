import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { validateQueryParams, formatErrors } from "../middleware/validation";
import { ok, badRequest, withErrorHandler } from "../middleware/response";
import { taskQuerySchema } from "../middleware/schemas";
import { deleteTask } from "../services/taskServices";

async function handler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`DeleteTask — ${request.url}`);

    const query = validateQueryParams(request, taskQuerySchema);
    if (!query.success) return badRequest(formatErrors(query.errors));

    await deleteTask(query.data.id, query.data.organizationId);
    return ok();
}

app.http("DeleteTask", {
    methods: ["DELETE"],
    authLevel: "anonymous",
    handler: withErrorHandler(handler),
});