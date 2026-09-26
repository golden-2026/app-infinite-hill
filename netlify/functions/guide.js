import guide from "../../api/guide.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";

export const handler = adaptVercelHandler(guide);
