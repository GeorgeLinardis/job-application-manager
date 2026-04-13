import { Hono } from "hono";
import { cors } from "hono/cors";
import { sign, verify } from "hono/jwt";

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
  const body = await requestContext.req.json<Record<string, unknown>>().catch(() => null);

  if (
    !body ||
    typeof body.username !== "string" ||
    typeof body.password !== "string" ||
    !body.username.trim() ||
    !body.password.trim()
  ) {
    return requestContext.json({ error: "username and password are required" }, 400);
  }

  const { username, password } = body;

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
    requestContext.env.JWT_SECRET,
    "HS256"
  );

  return requestContext.json({ token });
});

/**
 * JWT middleware — protects all /jobs routes.
 * Expects `Authorization: Bearer <token>` header.
 */
app.use("/jobs/*", async (requestContext, next) => {
  const authHeader = requestContext.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return requestContext.json({ error: "Unauthorized" }, 401);
  }

  try {
    await verify(authHeader.slice(7), requestContext.env.JWT_SECRET, "HS256");
    await next();
  } catch {
    return requestContext.json({ error: "Invalid or expired token" }, 401);
  }
});

/**
 * Reads all jobs from KV storage.
 * Returns an empty array if no jobs have been stored yet.
 */
async function readJobsFromKV(kv: KVNamespace): Promise<unknown[]> {
  const raw = await kv.get("jobs");
  return raw ? JSON.parse(raw) : [];
}

/**
 * Writes the full jobs array to KV storage.
 */
async function writeJobsToKV(kv: KVNamespace, jobs: unknown[]): Promise<void> {
  await kv.put("jobs", JSON.stringify(jobs));
}

/**
 * GET /jobs
 * Returns all job applications from KV storage.
 */
app.get("/jobs", async (requestContext) => {
  const jobs = await readJobsFromKV(requestContext.env.JOBS_KV);
  return requestContext.json(jobs);
});

/**
 * POST /jobs
 * Creates a new job application and prepends it to KV storage.
 * Expects the full JobFormData payload in the request body.
 */
app.post("/jobs", async (requestContext) => {
  const data = await requestContext.req.json();
  const jobs = await readJobsFromKV(requestContext.env.JOBS_KV);

  const now = new Date().toISOString();
  const newJob = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  await writeJobsToKV(requestContext.env.JOBS_KV, [newJob, ...jobs]);

  return requestContext.json(newJob, 201);
});

/**
 * PUT /jobs/:id
 * Updates an existing job application by id in KV storage.
 * Merges the request body with the stored job, preserving id and createdAt.
 */
app.put("/jobs/:id", async (requestContext) => {
  const jobId = requestContext.req.param("id");
  const patch = await requestContext.req.json<Record<string, unknown>>();
  const jobs = await readJobsFromKV(requestContext.env.JOBS_KV);
  const typedJobs = jobs as Array<{ id: string }>;

  const jobIndex = typedJobs.findIndex((job) => job.id === jobId);
  if (jobIndex === -1) {
    return requestContext.json({ error: "Job not found" }, 404);
  }

  const updatedJob = {
    ...(jobs[jobIndex] as object),
    ...patch,
    id: jobId,
    updatedAt: new Date().toISOString(),
  };

  const updatedJobs = [...jobs];
  updatedJobs[jobIndex] = updatedJob;
  await writeJobsToKV(requestContext.env.JOBS_KV, updatedJobs);

  return requestContext.json(updatedJob);
});

/**
 * DELETE /jobs/:id
 * Removes a job application by id from KV storage.
 */
app.delete("/jobs/:id", async (requestContext) => {
  const jobId = requestContext.req.param("id");
  const jobs = await readJobsFromKV(requestContext.env.JOBS_KV);
  const filtered = (jobs as Array<{ id: string }>).filter(
    (job) => job.id !== jobId
  );
  await writeJobsToKV(requestContext.env.JOBS_KV, filtered);
  return requestContext.json({ success: true });
});

export default app;
