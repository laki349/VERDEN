(function () {
  function buildAddressLeadPayload(address) {
    const sessionId = window.Verden.analytics?.getSessionId?.() || "";
    const addressText =
      address.displayAddress || address.roadAddress || address.jibunAddress || "";

    return {
      session_id: sessionId,
      address,
      address_text: addressText,
      detail_address: address.detailAddress || "",
      address_type: address.addressType || "",
      zonecode: address.zonecode || "",
      sido: address.sido || "",
      sigungu: address.sigungu || "",
      road_address: address.roadAddress || "",
      jibun_address: address.jibunAddress || "",
      building_name: address.buildingName || "",
      path: window.location.pathname,
      referrer: document.referrer || "",
      user_agent: navigator.userAgent,
    };
  }

  async function submitAddressLead(address) {
    const payload = buildAddressLeadPayload(address);

    const response = await fetch("/api/address-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "Failed to save address lead.");
    }

    return response.json();
  }

  window.Verden = window.Verden || {};
  window.Verden.addressLeadsApi = {
    submitAddressLead,
  };
})();
