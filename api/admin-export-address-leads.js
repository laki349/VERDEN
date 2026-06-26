const {
  ensureAdminAuth,
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  sendJson,
} = require("./_supabase");

const EXPORT_SELECT = [
  "created_at",
  "session_id",
  "address_type",
  "sido",
  "sigungu",
  "zonecode",
  "address_text",
  "detail_address",
  "road_address",
  "jibun_address",
  "building_name",
].join(",");

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(addressLeads) {
  const columns = [
    "created_at",
    "session_id",
    "address_type",
    "sido",
    "sigungu",
    "zonecode",
    "address_text",
    "detail_address",
    "road_address",
    "jibun_address",
    "building_name",
  ];

  const rows = addressLeads.map((lead) => [
    lead.created_at,
    lead.session_id,
    lead.address_type,
    lead.sido,
    lead.sigungu,
    lead.zonecode,
    lead.address_text,
    lead.detail_address,
    lead.road_address,
    lead.jibun_address,
    lead.building_name,
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
        "address_leads",
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
        error: "Failed to export address leads.",
        detail,
      });
      return;
    }

    const addressLeads = await response.json();
    const today = new Date().toISOString().slice(0, 10);
    const csv = toCsv(addressLeads);

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="verden-address-leads-${today}.csv"`,
    );
    res.end(`\uFEFF${csv}`);
  } catch (error) {
    sendJson(res, 500, {
      error: "Unexpected admin address leads export API error.",
      detail: error.message,
    });
  }
};
