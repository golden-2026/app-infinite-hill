import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import guide from "./api/guide.js";
import commerce from "./api/commerce.js";
import { createStateDevMiddleware } from "./api/dev-state-middleware.js";

function guideDevRoute() {
  return {
    name: "guide-dev-route",
    configureServer(server) {
      server.middlewares.use("/api/guide", (req, res, next) => {
        if (req.url !== "/" && req.url !== "") return next();
        guide(req, res);
      });
    },
  };
}

function commerceDevRoute() {
  return {
    name: "commerce-dev-route",
    configureServer(server) {
      server.middlewares.use("/api/commerce", (req, res, next) => {
        if (req.url !== "/" && req.url !== "") return next();
        commerce(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), guideDevRoute(), commerceDevRoute(), createStateDevMiddleware()],
});
