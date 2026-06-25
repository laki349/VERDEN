(function () {
  const PURPOSE_STORAGE_KEY = "verdenSmoothiePurpose";

  function getModules() {
    return {
      dom: window.Verden.dom,
      location: window.Verden.location,
      state: window.Verden.state,
    };
  }

  function saveSmoothiePurposeDraft(purpose) {
    try {
      localStorage.setItem(PURPOSE_STORAGE_KEY, JSON.stringify(purpose));
    } catch {
      // Private browsing or a restrictive browser can make storage unavailable.
    }
  }

  function showSmoothiePurposeScene() {
    const { dom, state } = getModules();
    const {
      hero,
      locationScene,
      smoothiePurposeScene,
      bodyProfileScene,
      nutritionLoadingScene,
      checkoutPlaceholderScene,
      paymentScene,
    } = dom;

    if (!hero || !smoothiePurposeScene) return;

    state.setCurrentScene("smoothiePurpose");
    hero.classList.add("is-purpose");
    hero.classList.remove("is-body-profile", "is-nutrition-loading", "is-checkout-placeholder", "is-payment");
    locationScene?.setAttribute("aria-hidden", "true");
    smoothiePurposeScene.setAttribute("aria-hidden", "false");
    bodyProfileScene?.setAttribute("aria-hidden", "true");
    nutritionLoadingScene?.setAttribute("aria-hidden", "true");
    checkoutPlaceholderScene?.setAttribute("aria-hidden", "true");
    paymentScene?.setAttribute("aria-hidden", "true");
    document.title = "스무디 선택 — VERDEN";
  }

  function showLocationScene() {
    const { dom, location, state } = getModules();
    const {
      hero,
      heroContent,
      locationScene,
      smoothiePurposeScene,
      bodyProfileScene,
      nutritionLoadingScene,
      checkoutPlaceholderScene,
      paymentScene,
    } = dom;

    if (!hero || !locationScene) return;

    state.setCurrentScene("location");
    hero.classList.add("is-location");
    hero.classList.remove("is-purpose", "is-body-profile", "is-nutrition-loading", "is-checkout-placeholder", "is-payment");
    heroContent?.setAttribute("aria-hidden", "true");
    locationScene.setAttribute("aria-hidden", "false");
    smoothiePurposeScene?.setAttribute("aria-hidden", "true");
    bodyProfileScene?.setAttribute("aria-hidden", "true");
    nutritionLoadingScene?.setAttribute("aria-hidden", "true");
    checkoutPlaceholderScene?.setAttribute("aria-hidden", "true");
    paymentScene?.setAttribute("aria-hidden", "true");
    location?.renderAddressState();
    document.title = "배송 가능 지역 확인 — VERDEN";
  }

  function showBodyProfileScene() {
    const { dom, state } = getModules();
    const {
      hero,
      smoothiePurposeScene,
      bodyProfileScene,
      nutritionLoadingScene,
      checkoutPlaceholderScene,
      paymentScene,
    } = dom;

    if (!hero || !bodyProfileScene) return;

    state.setCurrentScene("bodyProfile");
    hero.classList.add("is-body-profile");
    hero.classList.remove("is-purpose", "is-nutrition-loading", "is-checkout-placeholder", "is-payment");
    smoothiePurposeScene?.setAttribute("aria-hidden", "true");
    bodyProfileScene.setAttribute("aria-hidden", "false");
    nutritionLoadingScene?.setAttribute("aria-hidden", "true");
    checkoutPlaceholderScene?.setAttribute("aria-hidden", "true");
    paymentScene?.setAttribute("aria-hidden", "true");
    window.Verden.bodyProfile?.renderBodyProfileState();
    document.title = "신체정보 입력 — VERDEN";
  }

  function handlePurposeSelect(button) {
    const { state } = getModules();
    const purpose = {
      type: button.dataset.smoothiePurpose,
      label: button.dataset.smoothieLabel,
    };

    state.setSmoothiePurpose(purpose);
    saveSmoothiePurposeDraft(purpose);
    window.Verden.analytics?.trackEvent("smoothie_purpose_selected", {
      scene: "smoothiePurpose",
      payload: purpose,
    });
    showBodyProfileScene();
  }

  function initializeSmoothiePurposeEvents() {
    const { dom } = getModules();

    dom.purposeBackButton?.addEventListener("click", showLocationScene);

    dom.smoothiePurposeButtons.forEach((button) => {
      button.addEventListener("click", () => handlePurposeSelect(button));
    });
  }

  function resetSmoothiePurposeUI() {
    const { dom } = getModules();

    dom.smoothiePurposeScene?.setAttribute("aria-hidden", "true");
    dom.bodyProfileScene?.setAttribute("aria-hidden", "true");
    dom.nutritionLoadingScene?.setAttribute("aria-hidden", "true");
    dom.checkoutPlaceholderScene?.setAttribute("aria-hidden", "true");
    dom.paymentScene?.setAttribute("aria-hidden", "true");
  }

  window.Verden = window.Verden || {};
  window.Verden.smoothiePurpose = {
    initializeSmoothiePurposeEvents,
    resetSmoothiePurposeUI,
    showBodyProfileScene,
    showLocationScene,
    showSmoothiePurposeScene,
  };
})();
