(function () {
  const SESSION_STORAGE_KEY = "verdenSessionId";

  function createId(prefix) {
    if (window.crypto?.randomUUID) {
      return `${prefix}_${window.crypto.randomUUID()}`;
    }

    const random = Math.random().toString(36).slice(2);
    return `${prefix}_${Date.now().toString(36)}_${random}`;
  }

  function getSessionId() {
    try {
      const existing = localStorage.getItem(SESSION_STORAGE_KEY);
      if (existing) return existing;

      const next = createId("session");
      localStorage.setItem(SESSION_STORAGE_KEY, next);
      return next;
    } catch {
      return createId("session");
    }
  }

  function getDeviceMeta() {
    return {
      language: navigator.language,
      platform: navigator.platform,
      screen: {
        width: window.screen?.width || null,
        height: window.screen?.height || null,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  function getEventContext(scene) {
    return {
      session_id: getSessionId(),
      scene: scene || window.Verden?.state?.getState?.().currentScene || null,
      path: window.location.pathname,
      referrer: document.referrer || "",
      user_agent: navigator.userAgent,
      device: getDeviceMeta(),
    };
  }

  async function trackEvent(eventName, payload = {}) {
    const eventPayload = {
      ...getEventContext(payload.scene),
      event_name: eventName,
      step_index: payload.stepIndex ?? null,
      payload: payload.payload || {},
    };

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
        keepalive: true,
      });

      if (!response.ok) {
        console.warn("VERDEN event tracking failed", await response.text());
      }
    } catch (error) {
      console.warn("VERDEN event tracking failed", error);
    }
  }

  window.Verden = window.Verden || {};
  window.Verden.analytics = {
    createId,
    getSessionId,
    trackEvent,
  };
})();
