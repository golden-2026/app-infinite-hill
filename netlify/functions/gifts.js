import gifts from "../../api/gifts.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";

export const handler = adaptVercelHandler(gifts);
