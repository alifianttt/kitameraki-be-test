import { v4 as uuidv4 } from "uuid";
import { getTasksContainer } from "./cosmoClient";
import { Task, CreateTaskBody, UpdateTaskBody } from "../models/task";

/**
 * Fetches all tasks belonging to an organisation.
 * Uses a parameterised query to prevent SQL injection.
 */
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

/** Fetches a single task by id and partition key. */
export async function getTask(id: string, organizationId: string): Promise<Task | undefined> {
    const container = getTasksContainer();
    const { resource } = await container.item(id, organizationId).read<Task>();
    return resource;
}

/** Creates a new task, auto-assigning a UUID. */
export async function createTask(body: CreateTaskBody): Promise<Task> {
    const container = getTasksContainer();
    const item: Task = { ...body, id: uuidv4() };
    const { resource } = await container.items.create<Task>(item);
    return resource!;
}

/** Applies a partial patch to an existing task. */
export async function updateTask(
    id: string,
    organizationId: string,
    body: UpdateTaskBody
): Promise<Task> {
    const container = getTasksContainer();

    const patchOperations = Object.entries(body).map(([key, value]) => ({
        op: "replace" as const,
        path: `/${key}`,
        value,
    }));

    const { resource } = await container
        .item(id, organizationId)
        .patch<Task>(patchOperations);

    return resource!;
}

/** Deletes a single task. */
export async function deleteTask(id: string, organizationId: string): Promise<void> {
    const container = getTasksContainer();
    await container.item(id, organizationId).delete();
}

/** Deletes multiple tasks concurrently. */
export async function bulkDeleteTasks(
    ids: string[],
    organizationId: string
): Promise<void> {
    const container = getTasksContainer();
    await Promise.all(
        ids.map((id) => container.item(id, organizationId).delete())
    );
}