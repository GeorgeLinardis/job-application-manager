import { Hono } from "hono";
import { cors } from "hono/cors";
import { sign } from "hono/jwt";

/** Cloudflare bindings and secrets available on `requestContext.env` */
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
app.get("/", (requestContext) => requestContext.json({ status: "ok" }));

/**
 * POST /auth/login
 *
 * MVP — single owner login only. No registration, no multi-user support.
 * Credentials are validated against OWNER_USERNAME and OWNER_PASSWORD
 * Worker secrets set via `wrangler secret put`.
 * Returns a signed JWT valid for 7 days on success.
 */
app.post("/auth/login", async (requestContext) => {
  const { username, password } = await requestContext.req.json<{
    username: string;
    password: string;
  }>();

  if (
    username !== requestContext.env.OWNER_USERNAME ||
    password !== requestContext.env.OWNER_PASSWORD
  ) {
    return requestContext.json({ error: "Invalid credentials" }, 401);
  }

  const token = await sign(
    {
      sub: "owner",
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    },
    requestContext.env.JWT_SECRET
  );

  return requestContext.json({ token });
});

export default app;
