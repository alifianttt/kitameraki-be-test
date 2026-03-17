import { getFormSettingsContainer } from "./cosmoClient";
import { FormSettings, UpsertFormSettingsBody } from "../models/formSettings";

export async function getFormSettings(
    organizationId: string
): Promise<FormSettings | undefined> {
    const container = getFormSettingsContainer();
    const { resource } = await container
        .item(organizationId, organizationId)
        .read<FormSettings>();
    return resource;
}

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

export async function deleteFormSettings(organizationId: string): Promise<void> {
    const container = getFormSettingsContainer();
    await container.item(organizationId, organizationId).delete();
}