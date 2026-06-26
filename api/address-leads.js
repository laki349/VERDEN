const {
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  readJsonBody,
  sendJson,
} = require("./_supabase");

function normalizeText(value) {
  return String(value || "").trim();
}

function getAddressText(body) {
  return normalizeText(
    body.address_text ||
      body.address?.displayAddress ||
      body.address?.roadAddress ||
      body.address?.jibunAddress,
  );
}

function buildLeadRecord(body, req) {
  const address = body.address && typeof body.address === "object"
    ? body.address
    : {};
  const addressText = getAddressText(body);
  const detailAddress = normalizeText(body.detail_address || address.detailAddress);
  const addressType = normalizeText(body.address_type || address.addressType);

  return {
    session_id: normalizeText(body.session_id),
    address,
    address_text: addressText,
    detail_address: detailAddress,
    address_type: addressType,
    zonecode: normalizeText(body.zonecode || address.zonecode),
    sido: normalizeText(body.sido || address.sido),
    sigungu: normalizeText(body.sigungu || address.sigungu),
    road_address: normalizeText(body.road_address || address.roadAddress),
    jibun_address: normalizeText(body.jibun_address || address.jibunAddress),
    building_name: normalizeText(body.building_name || address.buildingName),
    source: normalizeText(body.source) || "verden-address-step",
    user_agent: normalizeText(body.user_agent) || req.headers["user-agent"] || null,
    referrer: normalizeText(body.referrer) || null,
    path: normalizeText(body.path) || null,
  };
}

async function findDuplicateLead(record) {
  const query = [
    `session_id=eq.${encodeURIComponent(record.session_id)}`,
    `address_text=eq.${encodeURIComponent(record.address_text)}`,
    `detail_address=eq.${encodeURIComponent(record.detail_address)}`,
    `address_type=eq.${encodeURIComponent(record.address_type)}`,
    "select=id,created_at",
    "limit=1",
  ].join("&");

  const response = await fetch(getSupabaseRestUrl("address_leads", `?${query}`), {
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
    const record = buildLeadRecord(body, req);

    if (!record.session_id || !record.address_text || !record.detail_address || !record.address_type) {
      sendJson(res, 400, {
        error: "session_id, address_text, detail_address, and address_type are required.",
      });
      return;
    }

    const duplicate = await findDuplicateLead(record);
    if (duplicate) {
      sendJson(res, 200, {
        ok: true,
        duplicate: true,
        addressLead: duplicate,
      });
      return;
    }

    const response = await fetch(getSupabaseRestUrl("address_leads"), {
      method: "POST",
      headers: getSupabaseHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      const detail = await response.text();
      sendJson(res, response.status, {
        error: "Failed to save address lead.",
        detail,
      });
      return;
    }

    const rows = await response.json();
    sendJson(res, 200, {
      ok: true,
      addressLead: Array.isArray(rows) ? rows[0] : rows,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Unexpected address lead API error.",
      detail: error.message,
    });
  }
};
