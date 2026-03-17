

export interface FormSettings {
    id: string;
    organizationId: string;
    settings: Record<string, unknown>;
    updatedAt: string; 
}

export type UpsertFormSettingsBody = {
    settings: Record<string, unknown>;
};