(function () {
  const LOADING_STEPS = [
    "탄수화물 균형 확인 완료",
    "단백질 필요량 계산 완료",
    "지방 비율 조정 완료",
    "포만감 요소 반영 완료",
    "VERDEN 조합 완성 중",
  ];
  const LOADING_OFFSETS = [242, 181, 121, 60, 0];
  const STEP_DURATION_MS = 760;
  let activeTimers = [];

  function getModules() {
    return {
      checkout: window.Verden.checkoutPlaceholder,
      dom: window.Verden.dom,
      state: window.Verden.state,
    };
  }

  function clearLoadingTimers() {
    activeTimers.forEach((timer) => window.clearTimeout(timer));
    activeTimers = [];
  }

  function setLoadingStep(step, index = 0) {
    const { dom } = getModules();
    if (dom.nutritionLoader) {
      dom.nutritionLoader.style.setProperty(
        "--loader-offset",
        String(LOADING_OFFSETS[index] ?? 0),
      );
    }

    if (!dom.nutritionLoadingStep) return;

    dom.nutritionLoadingStep.classList.remove("is-changing");
    void dom.nutritionLoadingStep.offsetWidth;
    dom.nutritionLoadingStep.textContent = step;
    dom.nutritionLoadingStep.classList.add("is-changing");
  }

  function showNutritionLoadingScene() {
    const { dom, state } = getModules();
    const {
      hero,
      bodyProfileScene,
      nutritionLoadingScene,
      checkoutPlaceholderScene,
      paymentScene,
    } = dom;

    if (!hero || !nutritionLoadingScene) return;

    state.setCurrentScene("nutritionLoading");
    hero.classList.add("is-nutrition-loading");
    hero.classList.remove("is-body-profile", "is-purpose", "is-checkout-placeholder", "is-payment");
    bodyProfileScene?.setAttribute("aria-hidden", "true");
    nutritionLoadingScene.setAttribute("aria-hidden", "false");
    checkoutPlaceholderScene?.setAttribute("aria-hidden", "true");
    paymentScene?.setAttribute("aria-hidden", "true");
    setLoadingStep(LOADING_STEPS[0], 0);
    document.title = "영양 설계 중 — VERDEN";
  }

  function startNutritionLoading() {
    clearLoadingTimers();
    showNutritionLoadingScene();

    LOADING_STEPS.slice(1).forEach((step, index) => {
      activeTimers.push(
        window.setTimeout(() => {
          setLoadingStep(step, index + 1);
        }, STEP_DURATION_MS * (index + 1)),
      );
    });

    activeTimers.push(
      window.setTimeout(() => {
        clearLoadingTimers();
        getModules().checkout?.showCheckoutPlaceholderScene();
      }, STEP_DURATION_MS * LOADING_STEPS.length + 260),
    );
  }

  function resetNutritionLoadingUI() {
    const { dom } = getModules();
    clearLoadingTimers();
    dom.nutritionLoadingScene?.setAttribute("aria-hidden", "true");
    if (dom.nutritionLoadingStep) {
      dom.nutritionLoadingStep.textContent = LOADING_STEPS[0];
      dom.nutritionLoadingStep.classList.remove("is-changing");
    }
    dom.nutritionLoader?.style.setProperty("--loader-offset", "302");
  }

  window.Verden = window.Verden || {};
  window.Verden.nutritionLoading = {
    resetNutritionLoadingUI,
    showNutritionLoadingScene,
    startNutritionLoading,
  };
})();
