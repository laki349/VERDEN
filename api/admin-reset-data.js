const {
  ensureAdminAuth,
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  sendJson,
} = require("./_supabase");

function isMissingTableError(status, detail) {
  const text = String(detail || "").toLowerCase();
  return status === 404 ||
    text.includes("does not exist") ||
    text.includes("not found") ||
    text.includes("relation") ||
    text.includes("pgrst205");
}

async function deleteAllRows(table, { optional = false } = {}) {
  const response = await fetch(
    getSupabaseRestUrl(table, "?id=not.is.null&select=id"),
    {
      method: "DELETE",
      headers: getSupabaseHeaders({
        Prefer: "return=representation",
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    if (optional && isMissingTableError(response.status, detail)) {
      return null;
    }

    throw new Error(detail || `Failed to reset ${table}.`);
  }

  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (!ensureAdminAuth(req, res)) return;
  if (!ensureSupabaseEnv(res)) return;

  try {
    const deleted = {
      events: await deleteAllRows("events"),
      waitlist: await deleteAllRows("waitlist", { optional: true }),
      orders: await deleteAllRows("orders"),
    };

    sendJson(res, 200, {
      ok: true,
      deleted,
      waitlistSkipped: deleted.waitlist === null,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Failed to reset admin test data.",
      detail: error.message,
    });
  }
};
