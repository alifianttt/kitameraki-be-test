// utils/form-settings.util.ts

interface FieldConfig {
  id: string;
  label: string;
  type: string;
  isBuiltIn: boolean;
  colSpan: number;
  required: boolean;
}

interface RowConfig {
  id: string;
  fields: FieldConfig[];
}

/**
 * Extracts all non-built-in field configs from FormSettings.
 * These map 1-to-1 with customFields keys on a Task.
 */
export function extractCustomFieldConfigs(settings: Record<string, unknown>): FieldConfig[] {
  const rows = (settings?.rows ?? []) as RowConfig[];

  return rows
    .flatMap((row) => row.fields)
    .filter((field) => field.isBuiltIn === false);
}

/**
 * Given a raw form submission payload, separates built-in task fields
 * from custom fields based on the FormSettings config.
 */
export function splitBuiltInAndCustomFields(
  payload: Record<string, string>,
  customFieldConfigs: FieldConfig[]
): {
  builtIn: Record<string, string>;
  customFields: Record<string, string>;
} {
  const customFieldIds = new Set(customFieldConfigs.map((f) => f.id));

  const builtIn: Record<string, string> = {};
  const customFields: Record<string, string> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (customFieldIds.has(key)) {
      // Use label as the key (human-readable in DB)
      const config = customFieldConfigs.find((f) => f.id === key);
      const storageKey = config?.label ?? key;
      customFields[storageKey] = value;
    } else {
      builtIn[key] = value;
    }
  }

  return { builtIn, customFields };
}