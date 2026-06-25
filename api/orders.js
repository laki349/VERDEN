const {
  createOrderNumber,
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  readJsonBody,
  sendJson,
} = require("./_supabase");

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || null;
}

function buildOrderRecord(body, req) {
  const checkout = body.checkout || {};
  const baseProduct = checkout.baseProduct || body.baseProduct || {};
  const paymentMethod = body.payment || {};
  const paymentDetails = {
    deliveryTime: body.deliveryTime || null,
    contact: body.contact || {},
    payment: paymentMethod,
  };
  const address = body.address || {};

  return {
    order_number: createOrderNumber(),
    submission_id: body.submission_id,
    session_id: body.session_id,
    status: "intent_submitted",
    source: "verden-funnel",

    address,
    smoothie_purpose: body.smoothiePurpose || body.smoothie_purpose || {},
    nutrition_profile: body.nutritionProfile || body.nutrition_profile || {},
    nutrition_result: body.nutritionResult || body.nutrition_result || {},
    checkout,
    payment: paymentDetails,

    product_name: baseProduct.name || null,
    product_price: Number(baseProduct.price || checkout.productAmount || 0),
    add_ons: checkout.selectedAddOns || [],
    subtotal: Number(checkout.subtotal || 0),
    delivery_fee: Number(checkout.deliveryFee || 0),
    total: Number(checkout.total || 0),

    delivery_time: body.deliveryTime || null,
    contact_phone: body.contact?.phone || null,
    safe_number: body.contact?.safeNumber ?? true,
    payment_method: paymentMethod.method || body.paymentMethod || null,

    user_agent: body.user_agent || req.headers["user-agent"] || null,
    referrer: body.referrer || null,
    path: body.path || null,
    ip_address: getClientIp(req),
  };
}

async function findOrderBySubmissionId(submissionId) {
  const query = `?submission_id=eq.${encodeURIComponent(submissionId)}&select=id,order_number,submission_id,created_at&limit=1`;
  const response = await fetch(getSupabaseRestUrl("orders", query), {
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

    if (!body.session_id || !body.submission_id) {
      sendJson(res, 400, {
        error: "session_id and submission_id are required.",
      });
      return;
    }

    const record = buildOrderRecord(body, req);
    const response = await fetch(getSupabaseRestUrl("orders"), {
      method: "POST",
      headers: getSupabaseHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(record),
    });

    if (response.ok) {
      const rows = await response.json();
      sendJson(res, 200, {
        ok: true,
        order: Array.isArray(rows) ? rows[0] : rows,
      });
      return;
    }

    const detailText = await response.text();
    const isDuplicate =
      response.status === 409 ||
      detailText.includes("23505") ||
      detailText.toLowerCase().includes("duplicate");

    if (isDuplicate) {
      const existingOrder = await findOrderBySubmissionId(body.submission_id);
      sendJson(res, 200, {
        ok: true,
        duplicate: true,
        order: existingOrder,
      });
      return;
    }

    sendJson(res, response.status, {
      error: "Failed to save order.",
      detail: detailText,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Unexpected order API error.",
      detail: error.message,
    });
  }
};
