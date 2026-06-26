const {
  ensureAdminAuth,
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  sendJson,
} = require("./_supabase");

const ADDRESS_LEAD_SELECT = [
  "id",
  "created_at",
  "session_id",
  "address_text",
  "detail_address",
  "address_type",
  "sido",
  "sigungu",
  "zonecode",
  "road_address",
  "jibun_address",
  "building_name",
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
        "address_leads",
        `?select=${encodeURIComponent(ADDRESS_LEAD_SELECT)}&order=created_at.desc&limit=100`,
      ),
      {
        method: "GET",
        headers: getSupabaseHeaders(),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      sendJson(res, response.status, {
        error: "Failed to load address leads.",
        detail,
      });
      return;
    }

    const addressLeads = await response.json();
    sendJson(res, 200, { addressLeads });
  } catch (error) {
    sendJson(res, 500, {
      error: "Unexpected admin address leads API error.",
      detail: error.message,
    });
  }
};
