/** localStorage key used to persist the JWT between page refreshes. */
export const TOKEN_KEY = "joa_token";

/** Base URL for the Cloudflare Worker API. */
export const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? "";
