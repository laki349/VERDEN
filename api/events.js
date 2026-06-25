const {
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  readJsonBody,
  sendJson,
} = require("./_supabase");

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
    const sessionId = String(body.session_id || "").trim();
    const eventName = String(body.event_name || "").trim();

    if (!sessionId || !eventName) {
      sendJson(res, 400, {
        error: "session_id and event_name are required.",
      });
      return;
    }

    const eventPayload = {
      session_id: sessionId,
      event_name: eventName,
      scene: body.scene || null,
      step_index: Number.isFinite(Number(body.step_index))
        ? Number(body.step_index)
        : null,
      path: body.path || null,
      referrer: body.referrer || null,
      user_agent:
        body.user_agent ||
        req.headers["user-agent"] ||
        null,
      device: body.device || {},
      payload: body.payload || {},
    };

    const response = await fetch(getSupabaseRestUrl("events"), {
      method: "POST",
      headers: getSupabaseHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const detail = await response.text();
      sendJson(res, response.status, {
        error: "Failed to save event.",
        detail,
      });
      return;
    }

    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 500, {
      error: "Unexpected event API error.",
      detail: error.message,
    });
  }
};
