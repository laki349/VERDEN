const {
  ensureAdminAuth,
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  sendJson,
} = require("./_supabase");

const ORDER_SELECT = [
  "id",
  "created_at",
  "order_number",
  "session_id",
  "status",
  "product_name",
  "total",
  "add_ons",
  "delivery_date",
  "delivery_time",
  "address",
  "contact_phone",
  "payment_method",
].join(",");

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
    const response = await fetch(
      getSupabaseRestUrl(
        "orders",
        `?select=${encodeURIComponent(ORDER_SELECT)}&order=created_at.desc&limit=50`,
      ),
      {
        method: "GET",
        headers: getSupabaseHeaders(),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      sendJson(res, response.status, {
        error: "Failed to load orders.",
        detail,
      });
      return;
    }

    const orders = await response.json();
    sendJson(res, 200, { orders });
  } catch (error) {
    sendJson(res, 500, {
      error: "Unexpected admin orders API error.",
      detail: error.message,
    });
  }
};
