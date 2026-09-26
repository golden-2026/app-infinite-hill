import commerce from "../../api/commerce.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";

export const handler = adaptVercelHandler(commerce);
