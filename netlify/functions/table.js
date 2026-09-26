import table from "../../api/table.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";

export const handler = adaptVercelHandler(table);
