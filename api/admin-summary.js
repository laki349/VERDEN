const {
  ensureAdminAuth,
  ensureSupabaseEnv,
  getSupabaseHeaders,
  getSupabaseRestUrl,
  sendJson,
} = require("./_supabase");

const FUNNEL_STEPS = [
  { key: "hero_view", label: "첫 화면 진입" },
  { key: "location_cta_click", label: "지역 확인 클릭" },
  { key: "address_selected", label: "주소 선택 완료" },
  { key: "smoothie_purpose_selected", label: "스무디 선택 완료" },
  { key: "body_profile_submitted", label: "신체정보 입력 완료" },
  { key: "checkout_view", label: "추천 화면 도달" },
  { key: "payment_view", label: "결제 화면 도달" },
  { key: "order_submit_success", label: "주문 의향 제출" },
  { key: "launch_waitlist_success", label: "출시 알림 신청" },
];

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

function roundRate(value) {
  return Math.round(value * 10) / 10;
}

function buildFunnel(rows) {
  const sessionsByStep = new Map(FUNNEL_STEPS.map((step) => [step.key, new Set()]));

  rows.forEach((row) => {
    if (!row.session_id || !sessionsByStep.has(row.event_name)) return;
    sessionsByStep.get(row.event_name).add(row.session_id);
  });

  return FUNNEL_STEPS.map((step, index) => {
    const count = sessionsByStep.get(step.key).size;
    const previousCount = index === 0
      ? count
      : sessionsByStep.get(FUNNEL_STEPS[index - 1].key).size;
    const conversionRate = index === 0
      ? 100
      : previousCount > 0
        ? roundRate((count / previousCount) * 100)
        : 0;
    const dropoffRate = index === 0 ? 0 : roundRate(Math.max(0, 100 - conversionRate));

    return {
      key: step.key,
      label: step.label,
      count,
      conversionRate,
      dropoffRate,
    };
  });
}

async function fetchFunnelRows() {
  const eventNames = FUNNEL_STEPS.map((step) => step.key).join(",");
  const query = `?event_name=in.(${eventNames})&select=event_name,session_id&limit=10000`;
  const response = await fetch(getSupabaseRestUrl("events", query), {
    method: "GET",
    headers: getSupabaseHeaders(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Failed to load funnel events.");
  }

  return response.json();
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
      funnelRows,
    ] = await Promise.all([
      fetchCount("events"),
      fetchCount("orders"),
      fetchCount("events", "?event_name=eq.payment_view"),
      fetchCount("events", "?event_name=eq.order_submit_success"),
      fetchFunnelRows(),
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
      funnel: buildFunnel(funnelRows),
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Failed to load admin summary.",
      detail: error.message,
    });
  }
};
