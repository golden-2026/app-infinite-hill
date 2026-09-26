import log from "../../api/log.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";

export const handler = adaptVercelHandler(log);
