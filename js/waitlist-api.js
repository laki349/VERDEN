(function () {
  function buildWaitlistPayload(payload) {
    return {
      ...payload,
      session_id: payload.session_id || window.Verden.analytics?.getSessionId?.() || "",
      path: window.location.pathname,
      referrer: document.referrer || "",
      user_agent: navigator.userAgent,
    };
  }

  async function submitWaitlist(payload) {
    const requestPayload = buildWaitlistPayload(payload);
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Failed to submit VERDEN waitlist.");
    }

    return data;
  }

  window.Verden = window.Verden || {};
  window.Verden.waitlistApi = {
    submitWaitlist,
  };
})();
