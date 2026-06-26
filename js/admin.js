(function () {
  const TOKEN_KEY = "verdenAdminToken";

  const elements = {
    tokenInput: document.querySelector("#admin-token"),
    tokenSave: document.querySelector("#admin-token-save"),
    status: document.querySelector("#admin-status"),
    refresh: document.querySelector("#admin-refresh"),
    export: document.querySelector("#admin-export"),
    summaryEvents: document.querySelector("#summary-events"),
    summaryOrders: document.querySelector("#summary-orders"),
    summaryPaymentViews: document.querySelector("#summary-payment-views"),
    summaryOrderSuccess: document.querySelector("#summary-order-success"),
    summaryConversion: document.querySelector("#summary-conversion"),
    ordersBody: document.querySelector("#orders-body"),
    ordersCount: document.querySelector("#orders-count"),
  };

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function setStatus(message) {
    if (elements.status) elements.status.textContent = message;
  }

  function formatWon(value) {
    return `${Number(value || 0).toLocaleString("ko-KR")}원`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function maskPhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length < 7) return phone || "-";
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  }

  function getAddressType(address) {
    if (!address?.addressType) return "-";
    return address.addressType === "work" ? "회사" : "집";
  }

  function formatAddOns(addOns) {
    if (!Array.isArray(addOns) || addOns.length === 0) return "기본 추천 조합";
    return addOns
      .map((addOn) => addOn.name || addOn.id || "옵션")
      .join(", ");
  }

  function renderSummary(summary) {
    elements.summaryEvents.textContent = Number(summary.totalEvents || 0).toLocaleString("ko-KR");
    elements.summaryOrders.textContent = Number(summary.totalOrders || 0).toLocaleString("ko-KR");
    elements.summaryPaymentViews.textContent = Number(summary.paymentViews || 0).toLocaleString("ko-KR");
    elements.summaryOrderSuccess.textContent = Number(summary.orderSubmitSuccess || 0).toLocaleString("ko-KR");
    elements.summaryConversion.textContent = `${summary.paymentToOrderRate || 0}%`;
  }

  function renderOrders(orders) {
    elements.ordersCount.textContent = `${orders.length.toLocaleString("ko-KR")}건`;

    if (orders.length === 0) {
      elements.ordersBody.innerHTML = '<tr><td colspan="11">아직 주문 의향 데이터가 없어요.</td></tr>';
      return;
    }

    elements.ordersBody.innerHTML = orders
      .map((order) => `
        <tr>
          <td>${escapeHtml(formatDate(order.created_at))}</td>
          <td>${escapeHtml(order.order_number || "-")}</td>
          <td>${escapeHtml(order.product_name || "-")}</td>
          <td>${escapeHtml(formatWon(order.total))}</td>
          <td>${escapeHtml(formatAddOns(order.add_ons))}</td>
          <td>${escapeHtml(order.delivery_date || "-")}</td>
          <td>${escapeHtml(order.delivery_time || "-")}</td>
          <td>${escapeHtml(getAddressType(order.address))}</td>
          <td>${escapeHtml(maskPhone(order.contact_phone))}</td>
          <td>${escapeHtml(order.payment_method || "-")}</td>
          <td>${escapeHtml(order.status || "-")}</td>
        </tr>
      `)
      .join("");
  }

  async function requestAdmin(path, options = {}) {
    const token = getToken();
    if (!token) throw new Error("관리자 토큰을 먼저 저장해주세요.");

    const response = await fetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (response.status === 401) {
      throw new Error("관리자 토큰을 확인해주세요.");
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || "관리자 API 요청에 실패했어요.");
    }

    return response;
  }

  async function loadAdminData() {
    setStatus("데이터를 불러오는 중이에요.");

    const [summaryResponse, ordersResponse] = await Promise.all([
      requestAdmin("/api/admin-summary"),
      requestAdmin("/api/admin-orders"),
    ]);

    const summary = await summaryResponse.json();
    const { orders } = await ordersResponse.json();

    renderSummary(summary);
    renderOrders(orders || []);
    setStatus("데이터를 불러왔어요.");
  }

  async function downloadCsv() {
    setStatus("CSV를 준비하는 중이에요.");
    const response = await requestAdmin("/api/admin-export-orders");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verden-orders-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("CSV 다운로드를 시작했어요.");
  }

  function saveToken() {
    const token = elements.tokenInput.value.trim();
    if (!token) {
      setStatus("관리자 토큰을 입력해주세요.");
      return;
    }

    sessionStorage.setItem(TOKEN_KEY, token);
    setStatus("토큰을 저장했어요. 데이터를 조회할게요.");
    loadAdminData().catch((error) => setStatus(error.message));
  }

  function initializeAdmin() {
    const existingToken = getToken();
    if (existingToken && elements.tokenInput) {
      elements.tokenInput.value = existingToken;
    }

    elements.tokenSave?.addEventListener("click", saveToken);
    elements.refresh?.addEventListener("click", () => {
      loadAdminData().catch((error) => setStatus(error.message));
    });
    elements.export?.addEventListener("click", () => {
      downloadCsv().catch((error) => setStatus(error.message));
    });

    if (existingToken) {
      loadAdminData().catch((error) => setStatus(error.message));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAdmin, { once: true });
  } else {
    initializeAdmin();
  }
})();
