export type {
    CreateTaskBody,
    UpdateTaskBody,
} from "../middleware/schemas";
 
// Full Task shape (as stored in Cosmos DB)
import { z } from "zod";
import { createTaskSchema } from "../middleware/schemas";
 
export type Task = z.infer<typeof createTaskSchema> & { id: string };