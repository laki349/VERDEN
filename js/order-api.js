(function () {
  let activeSubmission = null;

  function createSubmissionId() {
    return window.Verden.analytics?.createId("submission") ||
      `submission_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  }

  function buildOrderRequestPayload(orderPayload, submissionId) {
    return {
      ...orderPayload,
      session_id: window.Verden.analytics?.getSessionId?.() || "",
      submission_id: submissionId,
      path: window.location.pathname,
      referrer: document.referrer || "",
      user_agent: navigator.userAgent,
    };
  }

  async function submitOrder(orderPayload) {
    if (activeSubmission) return activeSubmission.promise;

    const submissionId = createSubmissionId();
    const requestPayload = buildOrderRequestPayload(orderPayload, submissionId);

    const promise = fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        const message = data.error || "Failed to submit VERDEN order.";
        throw new Error(message);
      }

      return {
        ...data,
        submissionId,
      };
    }).finally(() => {
      activeSubmission = null;
    });

    activeSubmission = {
      id: submissionId,
      promise,
    };

    return promise;
  }

  window.Verden = window.Verden || {};
  window.Verden.orderApi = {
    submitOrder,
  };
})();
