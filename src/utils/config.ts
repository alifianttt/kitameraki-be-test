function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
 
export const config = {
    cosmos: {
        endpoint: requireEnv("COSMOS_ENDPOINT"),
        key: requireEnv("COSMOS_KEY"),
        database: requireEnv("COSMOS_DATABASE"),
        containers: {
            tasks: requireEnv("COSMOS_TASKS_CONTAINER"),
            formSettings: requireEnv("COSMOS_SETTINGS_CONTAINER"),
        },
    },
} as const;
