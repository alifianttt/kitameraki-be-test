import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { validateQueryParams, parseJsonBody, formatErrors } from "../middleware/validation";
import { ok, created, badRequest, notFound, withErrorHandler } from "../middleware/response";
import { orgQuerySchema, upsertFormSettingsSchema, validate } from "../middleware/schemas";
import {
    getFormSettings,
    upsertFormSettings,
    deleteFormSettings,
} from "../services/formSettingsService";
import { UpsertFormSettingsBody } from "../models/formSettings";

// ─── GET /api/GetFormSettings?organizationId=... ──────────────────────────────

async function getHandler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`GetFormSettings — ${request.url}`);

    const query = validateQueryParams(request, orgQuerySchema);
    if (!query.success) return badRequest(formatErrors(query.errors));

    const settings = await getFormSettings(query.data.organizationId);
    if (!settings) return notFound(`No form settings found for organisation '${query.data.organizationId}'.`);

    return ok(settings);
}

app.http("GetFormSettings", {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: withErrorHandler(getHandler),
});

// ─── POST /api/UpsertFormSettings?organizationId=... ─────────────────────────

async function upsertHandler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`UpsertFormSettings — ${request.url}`);

    const query = validateQueryParams(request, orgQuerySchema);
    if (!query.success) return badRequest(formatErrors(query.errors));

    const raw = await parseJsonBody(request);

    const body = validate(upsertFormSettingsSchema, raw);

    if (!body.success) {
        return badRequest(formatErrors(body.errors));
    }

    const { data } = body;

    const saved = await upsertFormSettings(
        query.data.organizationId,
        data as UpsertFormSettingsBody
    );
    return created(saved);
}

app.http("UpsertFormSettings", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: withErrorHandler(upsertHandler),
});

// ─── DELETE /api/DeleteFormSettings?organizationId=... ───────────────────────

async function deleteHandler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log(`DeleteFormSettings — ${request.url}`);

    const query = validateQueryParams(request, orgQuerySchema);
    if (!query.success) return badRequest(formatErrors(query.errors));

    await deleteFormSettings(query.data.organizationId);
    return ok();
}

app.http("DeleteFormSettings", {
    methods: ["DELETE"],
    authLevel: "anonymous",
    handler: withErrorHandler(deleteHandler),
});