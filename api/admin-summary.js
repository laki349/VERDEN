const {
  ensureAdminAuth,
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  sendJson,
} = require("./_supabase");

function getCountFromContentRange(contentRange) {
  if (!contentRange || !contentRange.includes("/")) return 0;
  const count = Number(contentRange.split("/").pop());
  return Number.isFinite(count) ? count : 0;
}

async function fetchCount(table, query = "") {
  const separator = query ? "&" : "?";
  const response = await fetch(
    getSupabaseRestUrl(table, `${query}${separator}select=id&limit=1`),
    {
      method: "GET",
      headers: getSupabaseHeaders({
        Prefer: "count=exact",
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Failed to count ${table}.`);
  }

  return getCountFromContentRange(response.headers.get("content-range"));
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (!ensureAdminAuth(req, res)) return;
  if (!ensureSupabaseEnv(res)) return;

  try {
    const [
      totalEvents,
      totalOrders,
      paymentViews,
      orderSubmitSuccess,
    ] = await Promise.all([
      fetchCount("events"),
      fetchCount("orders"),
      fetchCount("events", "?event_name=eq.payment_view"),
      fetchCount("events", "?event_name=eq.order_submit_success"),
    ]);

    const paymentToOrderRate = paymentViews > 0
      ? Math.round((orderSubmitSuccess / paymentViews) * 1000) / 10
      : 0;

    sendJson(res, 200, {
      totalEvents,
      totalOrders,
      paymentViews,
      orderSubmitSuccess,
      paymentToOrderRate,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Failed to load admin summary.",
      detail: error.message,
    });
  }
};
