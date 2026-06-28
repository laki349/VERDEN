const {
  ensureAdminAuth,
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  sendJson,
} = require("./_supabase");

const EXPORT_SELECT = [
  "created_at",
  "order_number",
  "session_id",
  "smoothie_purpose",
  "product_name",
  "total",
  "add_ons",
  "delivery_date",
  "delivery_time",
  "address",
  "contact_phone",
  "payment_method",
  "status",
].join(",");

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function getAddressValue(address, keys) {
  if (!address || typeof address !== "object") return "";
  for (const key of keys) {
    if (address[key]) return address[key];
  }
  return "";
}

function formatAddOns(addOns) {
  if (!Array.isArray(addOns) || addOns.length === 0) return "";
  return addOns
    .map((addOn) => `${addOn.name || addOn.id || "옵션"} ${addOn.price ? `+${addOn.price}` : ""}`.trim())
    .join(" / ");
}

function getSmoothieType(smoothiePurpose) {
  if (!smoothiePurpose || typeof smoothiePurpose !== "object") return "";
  return smoothiePurpose.type || smoothiePurpose.smoothieType || smoothiePurpose.smoothie_type || "";
}

function getSmoothieLabel(smoothiePurpose, productName) {
  if (smoothiePurpose && typeof smoothiePurpose === "object" && smoothiePurpose.label) {
    return smoothiePurpose.label;
  }

  const productText = String(productName || "");
  if (productText.includes("다이어트")) return "다이어트용";
  if (productText.includes("운동")) return "운동보충용";
  if (productText.includes("식사")) return "식사대체용";
  return "";
}

function toCsv(orders) {
  const columns = [
    "created_at",
    "order_number",
    "session_id",
    "smoothie_type",
    "smoothie_label",
    "product_name",
    "total",
    "add_ons",
    "delivery_date",
    "delivery_time",
    "address_type",
    "address",
    "detail_address",
    "contact_phone",
    "payment_method",
    "status",
  ];

  const rows = orders.map((order) => [
    order.created_at,
    order.order_number,
    order.session_id,
    getSmoothieType(order.smoothie_purpose),
    getSmoothieLabel(order.smoothie_purpose, order.product_name),
    order.product_name,
    order.total,
    formatAddOns(order.add_ons),
    order.delivery_date,
    order.delivery_time,
    getAddressValue(order.address, ["addressType"]),
    getAddressValue(order.address, ["roadAddress", "displayAddress", "jibunAddress"]),
    getAddressValue(order.address, ["detailAddress"]),
    order.contact_phone,
    order.payment_method,
    order.status,
  ]);

  return [
    columns.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
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
    const response = await fetch(
      getSupabaseRestUrl(
        "orders",
        `?select=${encodeURIComponent(EXPORT_SELECT)}&order=created_at.desc&limit=10000`,
      ),
      {
        method: "GET",
        headers: getSupabaseHeaders(),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      sendJson(res, response.status, {
        error: "Failed to export orders.",
        detail,
      });
      return;
    }

    const orders = await response.json();
    const today = new Date().toISOString().slice(0, 10);
    const csv = toCsv(orders);

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="verden-orders-${today}.csv"`,
    );
    res.end(`\uFEFF${csv}`);
  } catch (error) {
    sendJson(res, 500, {
      error: "Unexpected admin export API error.",
      detail: error.message,
    });
  }
};
