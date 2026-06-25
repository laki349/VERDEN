const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

function setJsonHeaders(res, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function sendJson(res, statusCode, payload) {
  setJsonHeaders(res, statusCode);
  res.end(JSON.stringify(payload));
}

function ensureSupabaseEnv(res) {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    sendJson(res, 500, {
      error: "Missing Supabase environment variables.",
      missing,
    });
    return false;
  }

  return true;
}

function ensureAdminAuth(req, res) {
  if (!ADMIN_TOKEN) {
    sendJson(res, 500, {
      error: "Missing admin environment variable.",
      missing: ["ADMIN_TOKEN"],
    });
    return false;
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token || token !== ADMIN_TOKEN) {
    sendJson(res, 401, {
      error: "Unauthorized admin request.",
    });
    return false;
  }

  return true;
}

function getSupabaseRestUrl(table, query = "") {
  const baseUrl = SUPABASE_URL.replace(/\/$/, "");
  return `${baseUrl}/rest/v1/${table}${query}`;
}

function getSupabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    return req.body ? JSON.parse(req.body) : {};
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function createOrderNumber() {
  const now = new Date();
  const stamp = now
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VD-${stamp}-${suffix}`;
}

module.exports = {
  createOrderNumber,
  ensureAdminAuth,
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  readJsonBody,
  sendJson,
};
