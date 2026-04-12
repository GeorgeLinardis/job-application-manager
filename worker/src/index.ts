import { Hono } from "hono";
import { cors } from "hono/cors";

/** Cloudflare bindings and secrets available on `c.env` */
type Env = {
  JOBS_KV: KVNamespace;
  JWT_SECRET: string;
  OWNER_USERNAME: string;
  OWNER_PASSWORD: string;
};

const app = new Hono<{ Bindings: Env }>();

/**
 * Global CORS middleware.
 * In production, restrict `origin` to your Cloudflare Pages URL.
 */
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

/** Health check */
app.get("/", (c) => c.json({ status: "ok" }));

export default app;
