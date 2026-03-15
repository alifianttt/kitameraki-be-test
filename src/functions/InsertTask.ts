import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseJsonBody, formatErrors, ValidationError } from "../middleware/validation";
import { created, badRequest, withErrorHandler } from "../middleware/response";
import { createTaskSchema, validate } from "../middleware/schemas";
import { createTask } from "../services/taskServices";

async function handler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`InsertTask — ${request.url}`);

    const raw = await parseJsonBody(request);

    const body = validate(createTaskSchema, raw);
    if (!body.success) return badRequest(formatErrors(body.errors));

    const task = await createTask(body.data);
    return created(task);
}

app.http("InsertTask", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: withErrorHandler(handler),
});