import { CosmosClient, Container } from "@azure/cosmos";
import { config } from "../utils/config";
import * as http from "http";

/**
 * Singleton CosmosDB client — avoids creating a new TCP connection on every
 * function invocation (important for Azure Functions cold-start performance).
 */
let _client: CosmosClient | null = null;

function getClient(): CosmosClient {
    if (!_client) {
        const isLocalEmulator = config.cosmos.endpoint.startsWith("http://");
        _client = new CosmosClient({
            endpoint: config.cosmos.endpoint,
            key: config.cosmos.key,
            connectionPolicy: {
                enableEndpointDiscovery: false,
                ...(isLocalEmulator && { allowInsecureConnection: true }),
            },
        });
    }
    return _client;
}
 

export function getTasksContainer(): Container {
    return getClient()
        .database(config.cosmos.database)
        .container(config.cosmos.containers.tasks);
}

export function getFormSettingsContainer(): Container {
    return getClient()
        .database(config.cosmos.database)
        .container(config.cosmos.containers.formSettings);
}