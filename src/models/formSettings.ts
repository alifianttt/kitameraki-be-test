/**
 * Domain model for form-level settings stored per organisation.
 */

export interface FormSettings {
    /** Cosmos item id — same as organizationId for a 1-to-1 relationship */
    id: string;
    organizationId: string;
    /** Arbitrary key/value settings supplied by the client */
    settings: Record<string, unknown>;
    updatedAt: string; // ISO 8601
}

export type UpsertFormSettingsBody = {
    settings: Record<string, unknown>;
};