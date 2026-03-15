import { getFormSettingsContainer } from "./cosmoClient";
import { FormSettings, UpsertFormSettingsBody } from "../models/formSettings";

/** Retrieves form settings for an organisation, or undefined if none exist yet. */
export async function getFormSettings(
    organizationId: string
): Promise<FormSettings | undefined> {
    const container = getFormSettingsContainer();
    // id and partition key are both the organizationId for a 1-to-1 relationship
    const { resource } = await container
        .item(organizationId, organizationId)
        .read<FormSettings>();
    return resource;
}

/**
 * Creates or fully replaces the form settings for an organisation.
 * Using upsert means the client doesn't need to check for prior existence.
 */
export async function upsertFormSettings(
    organizationId: string,
    body: UpsertFormSettingsBody
): Promise<FormSettings> {
    const container = getFormSettingsContainer();

    const item: FormSettings = {
        id: organizationId,
        organizationId,
        settings: body.settings,
        updatedAt: new Date().toISOString(),
    };

    const { resource } = await container.items.upsert<FormSettings>(item);
    return resource!;
}

/** Deletes the form settings document for an organisation. */
export async function deleteFormSettings(organizationId: string): Promise<void> {
    const container = getFormSettingsContainer();
    await container.item(organizationId, organizationId).delete();
}