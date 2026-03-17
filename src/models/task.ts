export type {
    CreateTaskBody,
    UpdateTaskBody,
} from "../middleware/schemas";
 
import { z } from "zod";
import { createTaskSchema } from "../middleware/schemas";
 
export type Task = z.infer<typeof createTaskSchema> & { id: string };