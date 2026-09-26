import stripeWebhook from "../../api/stripe-webhook.js";
import { adaptVercelHandler } from "../_shared/vercel-adapter.js";

export const handler = adaptVercelHandler(stripeWebhook);
