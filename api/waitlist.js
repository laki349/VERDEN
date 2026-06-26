const {
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  readJsonBody,
  sendJson,
} = require("./_supabase");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function buildWaitlistRecord(body) {
  return {
    session_id: body.session_id || null,
    email: normalizeEmail(body.email),
    order_id: body.order_id || null,
    order_number: body.order_number || null,
    smoothie_type: body.smoothie_type || body.smoothieType || null,
    source: "verden-launch-waitlist",
  };
}

async function findWaitlistByEmail(email) {
  const query = `?email=eq.${encodeURIComponent(email)}&select=id,email,created_at&limit=1`;
  const response = await fetch(getSupabaseRestUrl("waitlist", query), {
    method: "GET",
    headers: getSupabaseHeaders(),
  });

  if (!response.ok) return null;

  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
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

  if (!ensureSupabaseEnv(res)) return;

  try {
    const body = await readJsonBody(req);
    const email = normalizeEmail(body.email);

    if (!EMAIL_PATTERN.test(email)) {
      sendJson(res, 400, { error: "올바른 이메일을 입력해주세요." });
      return;
    }

    const record = buildWaitlistRecord({ ...body, email });
    const response = await fetch(getSupabaseRestUrl("waitlist"), {
      method: "POST",
      headers: getSupabaseHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(record),
    });

    if (response.ok) {
      const rows = await response.json();
      sendJson(res, 200, {
        ok: true,
        waitlist: Array.isArray(rows) ? rows[0] : rows,
      });
      return;
    }

    const detailText = await response.text();
    const isDuplicate =
      response.status === 409 ||
      detailText.includes("23505") ||
      detailText.toLowerCase().includes("duplicate");

    if (isDuplicate) {
      const existing = await findWaitlistByEmail(email);
      sendJson(res, 200, {
        ok: true,
        duplicate: true,
        waitlist: existing,
      });
      return;
    }

    sendJson(res, response.status, {
      error: "Failed to save waitlist email.",
      detail: detailText,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Unexpected waitlist API error.",
      detail: error.message,
    });
  }
};
