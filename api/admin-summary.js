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

const SMOOTHIE_TYPES = [
  {
    key: "meal",
    label: "식사대체용",
    types: ["mealReplacement", "meal", "regularMeal"],
    names: ["식사대체", "식사대체용", "meal"],
  },
  {
    key: "workout",
    label: "운동보충용",
    types: ["proteinRecovery", "workout", "postWorkoutMeal"],
    names: ["운동보충", "운동보충용", "protein", "workout"],
  },
  {
    key: "diet",
    label: "다이어트용",
    types: ["diet", "dietSmoothie"],
    names: ["다이어트", "diet"],
  },
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

function normalizeSmoothieType(source = {}) {
  const values = [
    source.type,
    source.smoothieType,
    source.smoothie_type,
    source.label,
    source.product_name,
    source.productName,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim());

  for (const smoothie of SMOOTHIE_TYPES) {
    if (values.some((value) => smoothie.types.includes(value))) return smoothie.key;
    if (values.some((value) => {
      const lower = value.toLowerCase();
      return smoothie.names.some((name) => lower.includes(name.toLowerCase()));
    })) {
      return smoothie.key;
    }
  }

  return null;
}

function buildSmoothieStats(rows, getSource) {
  const counts = new Map(SMOOTHIE_TYPES.map((smoothie) => [smoothie.key, 0]));

  rows.forEach((row) => {
    const key = normalizeSmoothieType(getSource(row));
    if (!key || !counts.has(key)) return;
    counts.set(key, counts.get(key) + 1);
  });

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);

  return SMOOTHIE_TYPES.map((smoothie) => {
    const count = counts.get(smoothie.key) || 0;
    return {
      key: smoothie.key,
      label: smoothie.label,
      count,
      ratio: total > 0 ? roundRate((count / total) * 100) : 0,
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

async function fetchSmoothieEventRows() {
  const query = "?event_name=eq.smoothie_purpose_selected&select=payload,session_id&limit=10000";
  const response = await fetch(getSupabaseRestUrl("events", query), {
    method: "GET",
    headers: getSupabaseHeaders(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Failed to load smoothie events.");
  }

  return response.json();
}

async function fetchSmoothieOrderRows() {
  const query = "?select=smoothie_purpose,product_name&limit=10000";
  const response = await fetch(getSupabaseRestUrl("orders", query), {
    method: "GET",
    headers: getSupabaseHeaders(),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Failed to load smoothie orders.");
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
      smoothieEventRows,
      smoothieOrderRows,
    ] = await Promise.all([
      fetchCount("events"),
      fetchCount("orders"),
      fetchCount("events", "?event_name=eq.payment_view"),
      fetchCount("events", "?event_name=eq.order_submit_success"),
      fetchFunnelRows(),
      fetchSmoothieEventRows(),
      fetchSmoothieOrderRows(),
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
      smoothieStats: {
        eventBased: buildSmoothieStats(smoothieEventRows, (row) => row.payload || {}),
        orderBased: buildSmoothieStats(smoothieOrderRows, (row) => ({
          ...(row.smoothie_purpose || {}),
          product_name: row.product_name,
        })),
      },
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Failed to load admin summary.",
      detail: error.message,
    });
  }
};
