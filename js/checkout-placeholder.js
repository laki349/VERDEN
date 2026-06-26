(function () {
  const CHECKOUT_STORAGE_KEY = "verdenCheckoutDraft";
  const DELIVERY_FEE = 0;

  const PRODUCT_CONFIG = {
    mealReplacement: {
      id: "mealReplacement",
      name: "VERDEN 식사대체용 스무디",
      description: "든든한 한 끼를 위한 오트·바나나 베이스",
      image: "assets/meal-replacement-smoothie.png",
      imageAlt: "식사대체용 VERDEN 오트 바나나 스무디",
      price: 8900,
    },
    proteinRecovery: {
      id: "proteinRecovery",
      name: "VERDEN 운동보충용 스무디",
      description: "운동 후 회복을 위한 베리·단백질 베이스",
      image: "assets/protein-recovery-smoothie.png",
      imageAlt: "운동보충용 VERDEN 베리 단백질 스무디",
      price: 8900,
    },
    diet: {
      id: "diet",
      name: "VERDEN 다이어트용 스무디",
      description: "상큼한 베리와 가벼운 포만감으로 부담 없이 채우는 밸런스 스무디",
      image: "assets/diet-smoothie.png",
      imageAlt: "다이어트용 VERDEN 핑크 베리 스무디",
      price: 8900,
    },
  };

  const ADD_ON_CONFIG = {
    proteinBoost: {
      id: "proteinBoost",
      name: "단백질 추가",
      price: 2000,
    },
    lowSugarBlend: {
      id: "lowSugarBlend",
      name: "저당 과일 배합",
      price: 1500,
    },
  };

  let selectedAddOnIds = new Set();

  function getModules() {
    return {
      dom: window.Verden.dom,
      nutritionModal: window.Verden.nutritionModal,
      payment: window.Verden.payment,
      state: window.Verden.state,
    };
  }

  function formatWon(amount) {
    return `${Number(amount || 0).toLocaleString("ko-KR")}원`;
  }

  function formatMacroValue(value) {
    const number = Number(value || 0);
    const rounded = Number.isInteger(number) ? number : Math.round(number * 10) / 10;
    return `${rounded}g`;
  }

  function getBaseProduct() {
    const { state } = getModules();
    const purposeType = state.getState().smoothiePurpose?.type;
    return PRODUCT_CONFIG[purposeType] || PRODUCT_CONFIG.mealReplacement;
  }

  function calculateCheckoutState() {
    const baseProduct = getBaseProduct();
    const quantity = 1;
    const selectedAddOns = [...selectedAddOnIds]
      .map((id) => ADD_ON_CONFIG[id])
      .filter(Boolean);
    const productAmount = baseProduct.price * quantity;
    const addOnsAmount = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
    const subtotal = productAmount + addOnsAmount;
    const total = subtotal + DELIVERY_FEE;

    return {
      baseProduct,
      quantity,
      selectedAddOns,
      productAmount,
      addOnsAmount,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      total,
    };
  }

  function saveCheckoutDraft(checkoutState) {
    try {
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(checkoutState));
    } catch {
      // Private browsing or a restrictive browser can make storage unavailable.
    }
  }

  function renderProduct(checkoutState) {
    const { dom } = getModules();
    const { baseProduct } = checkoutState;

    if (dom.checkoutProductImage) {
      dom.checkoutProductImage.src = baseProduct.image;
      dom.checkoutProductImage.alt = baseProduct.imageAlt;
    }
    if (dom.checkoutProductName) {
      dom.checkoutProductName.textContent = baseProduct.name;
    }
    if (dom.checkoutProductDescription) {
      dom.checkoutProductDescription.textContent = baseProduct.description;
    }
    if (dom.checkoutProductPrice) {
      dom.checkoutProductPrice.textContent = formatWon(baseProduct.price);
    }
  }

  function renderAddOns() {
    const { dom } = getModules();

    dom.checkoutAddOnButtons.forEach((button) => {
      const isSelected = selectedAddOnIds.has(button.dataset.addonId);
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
      const stateLabel = button.querySelector("b");
      if (stateLabel) stateLabel.textContent = isSelected ? "선택됨" : "추가";
    });
  }

  function renderSummary(checkoutState) {
    const { dom } = getModules();

    if (dom.checkoutSummaryProduct) {
      dom.checkoutSummaryProduct.textContent = formatWon(checkoutState.productAmount);
    }
    if (dom.checkoutSummaryAddons) {
      dom.checkoutSummaryAddons.textContent = formatWon(checkoutState.addOnsAmount);
    }
    if (dom.checkoutSummaryDelivery) {
      dom.checkoutSummaryDelivery.innerHTML = `
        <span>첫배송 할인</span>
        <s>${formatWon(2500)}</s>
        <strong>${formatWon(checkoutState.deliveryFee)}</strong>
      `;
    }
    if (dom.checkoutSummaryTotal) {
      dom.checkoutSummaryTotal.textContent = formatWon(checkoutState.total);
    }
    if (dom.checkoutPlaceholderButton) {
      dom.checkoutPlaceholderButton.textContent = `${formatWon(checkoutState.total)} 결제하기`;
    }
  }

  function renderNutritionChips() {
    const { dom, nutritionModal, state } = getModules();
    const result = state.getState().nutritionResult;
    const macros = nutritionModal?.getMacros(result) || {};

    if (dom.checkoutCarbChip) {
      dom.checkoutCarbChip.textContent = formatMacroValue(macros.carbohydrateG);
    }
    if (dom.checkoutProteinChip) {
      dom.checkoutProteinChip.textContent = formatMacroValue(macros.proteinG);
    }
    if (dom.checkoutFatChip) {
      dom.checkoutFatChip.textContent = formatMacroValue(macros.fatG);
    }
  }

  function renderCheckout() {
    const { state } = getModules();
    const checkoutState = calculateCheckoutState();

    renderProduct(checkoutState);
    renderAddOns();
    renderSummary(checkoutState);
    renderNutritionChips();
    state.setCheckoutState(checkoutState);
    saveCheckoutDraft(checkoutState);

    return checkoutState;
  }

  function showCheckoutPlaceholderScene() {
    const { dom, state } = getModules();
    const {
      hero,
      nutritionLoadingScene,
      checkoutPlaceholderScene,
    } = dom;

    if (!hero || !checkoutPlaceholderScene) return;

    state.setCurrentScene("checkoutPlaceholder");
    hero.classList.add("is-checkout-placeholder");
    hero.classList.remove("is-nutrition-loading", "is-body-profile", "is-purpose", "is-payment");
    nutritionLoadingScene?.setAttribute("aria-hidden", "true");
    checkoutPlaceholderScene.setAttribute("aria-hidden", "false");
    dom.paymentScene?.setAttribute("aria-hidden", "true");
    renderCheckout();
    window.Verden.analytics?.trackEvent("checkout_view", {
      scene: "checkoutPlaceholder",
      payload: {
        checkout: state.getState().checkoutState,
      },
    });
    document.title = "주문 확인 — VERDEN";
  }

  function getCheckoutPayload() {
    const { state } = getModules();
    const currentState = state.getState();

    return {
      address: currentState.selectedAddress,
      smoothiePurpose: currentState.smoothiePurpose,
      nutritionProfile: currentState.nutritionProfile,
      nutritionResult: currentState.nutritionResult,
      checkout: currentState.checkoutState || renderCheckout(),
    };
  }

  function goToPaymentScene() {
    const { payment } = getModules();
    renderCheckout();
    payment?.showPaymentScene();
  }

  function toggleAddOn(addOnId) {
    if (selectedAddOnIds.has(addOnId)) {
      selectedAddOnIds.delete(addOnId);
    } else {
      selectedAddOnIds.add(addOnId);
    }

    renderCheckout();
  }

  function initializeCheckoutPlaceholderEvents() {
    const { dom } = getModules();

    dom.checkoutAddOnButtons.forEach((button) => {
      button.addEventListener("click", () => {
        toggleAddOn(button.dataset.addonId);
      });
    });

    dom.checkoutPlaceholderButton?.addEventListener(
      "click",
      goToPaymentScene,
    );
    dom.checkoutNutritionMoreButton?.addEventListener(
      "click",
      () => getModules().nutritionModal?.openNutritionModal(),
    );
  }

  function resetCheckoutPlaceholderUI() {
    const { dom, state } = getModules();
    selectedAddOnIds = new Set();
    dom.checkoutPlaceholderScene?.setAttribute("aria-hidden", "true");
    state.setCheckoutState(null);
    renderAddOns();
  }

  window.Verden = window.Verden || {};
  window.Verden.checkoutPlaceholder = {
    getCheckoutPayload,
    initializeCheckoutPlaceholderEvents,
    renderCheckout,
    resetCheckoutPlaceholderUI,
    showCheckoutPlaceholderScene,
  };
})();
