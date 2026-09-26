import stateHandler from "./state.js";

export function createStateDevMiddleware() {
  return {
    name: "golden-state-dev-route",
    configureServer(server) {
      server.middlewares.use("/api/state", (req, res, next) => {
        if (!req.url || (!req.url.startsWith("/") && req.url !== "")) return next();
        stateHandler(req, res);
      });
    },
  };
}
