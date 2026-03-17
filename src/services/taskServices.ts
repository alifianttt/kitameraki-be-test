import { v4 as uuidv4 } from "uuid";
import { PatchOperation } from "@azure/cosmos";
import { getTasksContainer } from "./cosmoClient";
import { Task, CreateTaskBody, UpdateTaskBody } from "../models/task";


export async function listTasks(organizationId: string): Promise<Task[]> {
    const container = getTasksContainer();
    const { resources } = await container.items
        .query<Task>({
            query: "SELECT * FROM c WHERE c.organizationId = @orgId",
            parameters: [{ name: "@orgId", value: organizationId }],
        })
        .fetchAll();
    return resources;
}

export async function getTask(id: string, organizationId: string): Promise<Task | undefined> {
    const container = getTasksContainer();
    const { resource } = await container.item(id, organizationId).read<Task>();
    return resource;
}

export async function createTask(body: CreateTaskBody): Promise<Task> {
    const container = getTasksContainer();
    const item: Task = { ...body, id: uuidv4() };
    const { resource } = await container.items.create<Task>(item);
    return resource!;
}


export async function updateTask(
    id: string,
    organizationId: string,
    body: UpdateTaskBody
): Promise<Task> {
    const container = getTasksContainer();

    const { customFields, ...standardFields } = body;

    const patchOperations: PatchOperation[] = [];

    for (const [key, value] of Object.entries(standardFields)) {
        if (value !== undefined) {
            patchOperations.push({ op: "set", path: `/${key}`, value });
        }
    }

    if (customFields && Object.keys(customFields).length > 0) {
        const existing = await container.item(id, organizationId).read<Task>();
        const hasCustomFields = existing.resource?.customFields !== undefined;

        if (!hasCustomFields) {
            patchOperations.push({ op: "add", path: "/customFields", value: customFields });
        } else {
            for (const [key, value] of Object.entries(customFields)) {
                patchOperations.push({ op: "set", path: `/customFields/${key}`, value });
            }
        }
    }

    const { resource } = await container
        .item(id, organizationId)
        .patch<Task>(patchOperations);

    return resource!;
}

export async function deleteTask(id: string, organizationId: string): Promise<void> {
    const container = getTasksContainer();
    await container.item(id, organizationId).delete();
}

export async function bulkDeleteTasks(
    ids: string[],
    organizationId: string
): Promise<void> {
    const container = getTasksContainer();
    await Promise.all(
        ids.map((id) => container.item(id, organizationId).delete())
    );
}