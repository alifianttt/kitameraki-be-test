import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { validateQueryParams, parseJsonBody, formatErrors } from "../middleware/validation";
import { ok, badRequest, withErrorHandler } from "../middleware/response";
import { orgQuerySchema, bulkDeleteBodySchema, validate } from "../middleware/schemas";
import { bulkDeleteTasks } from "../services/taskServices";

async function handler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`BulkDeleteTasks — ${request.url}`);

    const query = validateQueryParams(request, orgQuerySchema);
    if (!query.success) return badRequest(formatErrors(query.errors));

    const raw = await parseJsonBody(request);

    const body = validate(bulkDeleteBodySchema, raw);
    if (!body.success) return badRequest(formatErrors(body.errors));

    await bulkDeleteTasks(body.data, query.data.organizationId);
    return ok();
}

app.http("BulkDeleteTasks", {
    methods: ["DELETE"],
    authLevel: "anonymous",
    handler: withErrorHandler(handler),
});