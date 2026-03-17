import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseJsonBody, formatErrors } from "../middleware/validation";
import { created, badRequest, withErrorHandler } from "../middleware/response";
import { createTaskSchema, validate } from "../middleware/schemas";
import { createTask } from "../services/taskServices";
import { getFormSettings } from "../services/formSettingsService";
import { extractCustomFieldConfigs, splitBuiltInAndCustomFields } from "../utils/formSettingParser";

async function handler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`InsertTask — ${request.url}`);

    const raw = await parseJsonBody(request);

    const rawRecord = raw as Record<string, unknown>;

    const organizationId = typeof rawRecord?.organizationId === "string"
        ? rawRecord.organizationId
        : undefined;

    if (!organizationId) return badRequest("organizationId is required and must be a string");

    const formSettings = await getFormSettings(organizationId);
    const customFieldConfigs = extractCustomFieldConfigs(formSettings.settings);

    const { builtIn, customFields } = splitBuiltInAndCustomFields(
        rawRecord as Record<string, string>,
        customFieldConfigs
    );

    const body = validate(createTaskSchema, {
        ...builtIn,
        organizationId,
        ...(Object.keys(customFields).length > 0 && { customFields }),
    });
    if (!body.success) return badRequest(formatErrors(body.errors));

    const task = await createTask(body.data);
    return created(task);
}

app.http("InsertTask", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: withErrorHandler(handler),
});