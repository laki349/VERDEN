(function () {
  const PAYMENT_STORAGE_KEY = "verdenPaymentDraft";
  const METHOD_LABELS = {
    card: "신용/체크카드",
    kakaoPay: "카카오페이",
    tossPay: "토스페이",
    naverPay: "네이버페이",
  };

  const paymentDraft = {
    deliveryTime: "",
    contact: {
      phone: "",
      safeNumber: true,
    },
    payment: {
      method: null,
    },
  };
  let isSubmittingOrder = false;

  function getModules() {
    return {
      addressEditModal: window.Verden.addressEditModal,
      checkout: window.Verden.checkoutPlaceholder,
      dom: window.Verden.dom,
      nutritionModal: window.Verden.nutritionModal,
      state: window.Verden.state,
    };
  }

  function formatWon(amount) {
    return `${Number(amount || 0).toLocaleString("ko-KR")}원`;
  }

  function getCheckoutState() {
    const { checkout, state } = getModules();
    return state.getState().checkoutState || checkout?.renderCheckout();
  }

  function formatPhone(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  function formatDeliveryTimeLabel(value) {
    if (value === "24:00") return "자정 12:00";
    const [hourText, minuteText] = value.split(":");
    const hour = Number(hourText);
    const period = hour < 12 ? "오전" : "오후";
    const displayHour = hour <= 12 ? hour : hour - 12;
    return `${period} ${displayHour}:${minuteText}`;
  }

  function createDeliveryTimeOptions() {
    const options = [];
    for (let minutes = 6 * 60 + 30; minutes <= 23 * 60 + 30; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push({ value, label: formatDeliveryTimeLabel(value) });
    }
    options.push({ value: "24:00", label: formatDeliveryTimeLabel("24:00") });
    return options;
  }

  function populateDeliveryTimeOptions() {
    const { dom } = getModules();
    if (!dom.paymentDeliveryTime || dom.paymentDeliveryTime.dataset.ready === "true") return;

    createDeliveryTimeOptions().forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      dom.paymentDeliveryTime.appendChild(option);
    });
    dom.paymentDeliveryTime.dataset.ready = "true";
  }

  function savePaymentDraft(payload) {
    try {
      localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Private browsing or a restrictive browser can make storage unavailable.
    }
  }

  function buildPaymentState() {
    const { state } = getModules();
    const currentState = state.getState();
    const checkoutState = getCheckoutState();

    return {
      smoothiePurpose: currentState.smoothiePurpose,
      nutritionProfile: currentState.nutritionProfile,
      nutritionResult: currentState.nutritionResult,
      baseProduct: checkoutState.baseProduct,
      quantity: checkoutState.quantity,
      selectedAddOns: checkoutState.selectedAddOns,
      subtotal: checkoutState.subtotal,
      deliveryFee: checkoutState.deliveryFee,
      total: checkoutState.total,
      address: {
        roadAddress: currentState.selectedAddress.roadAddress || currentState.selectedAddress.displayAddress,
        jibunAddress: currentState.selectedAddress.jibunAddress,
        detailAddress: currentState.selectedAddress.detailAddress,
        addressType: currentState.selectedAddress.addressType,
      },
      deliveryTime: paymentDraft.deliveryTime,
      contact: { ...paymentDraft.contact },
      payment: { ...paymentDraft.payment },
    };
  }

  function renderOrder(checkoutState) {
    const { dom } = getModules();
    const { baseProduct } = checkoutState;

    if (dom.paymentProductImage) {
      dom.paymentProductImage.src = baseProduct.image;
      dom.paymentProductImage.alt = baseProduct.imageAlt;
    }
    if (dom.paymentProductName) dom.paymentProductName.textContent = baseProduct.name;
    if (dom.paymentProductDescription) dom.paymentProductDescription.textContent = baseProduct.description;
    if (dom.paymentProductPrice) dom.paymentProductPrice.textContent = `수량 1개 · ${formatWon(baseProduct.price)}`;

    if (dom.paymentOrderAddOns) {
      if (checkoutState.selectedAddOns.length === 0) {
        dom.paymentOrderAddOns.textContent = "기본 추천 조합";
      } else {
        dom.paymentOrderAddOns.innerHTML = checkoutState.selectedAddOns
          .map((addOn) => `<span>${addOn.name} <strong>+${formatWon(addOn.price)}</strong></span>`)
          .join("");
      }
    }
  }

  function renderAddress() {
    const { dom, state } = getModules();
    const { selectedAddress } = state.getState();

    if (dom.paymentAddressRoad) {
      dom.paymentAddressRoad.textContent = selectedAddress.roadAddress || selectedAddress.displayAddress || "주소를 확인해주세요.";
    }
    if (dom.paymentAddressDetail) {
      dom.paymentAddressDetail.textContent = selectedAddress.detailAddress || "";
    }
    if (dom.paymentAddressType) {
      dom.paymentAddressType.textContent = selectedAddress.addressType === "work" ? "회사" : "집";
    }
  }

  function renderSummary(checkoutState) {
    const { dom } = getModules();
    if (dom.paymentSummaryProduct) dom.paymentSummaryProduct.textContent = formatWon(checkoutState.productAmount);
    if (dom.paymentSummaryAddons) dom.paymentSummaryAddons.textContent = formatWon(checkoutState.addOnsAmount);
    if (dom.paymentSummaryDelivery) dom.paymentSummaryDelivery.textContent = formatWon(checkoutState.deliveryFee);
    if (dom.paymentSummaryTotal) dom.paymentSummaryTotal.textContent = formatWon(checkoutState.total);
  }

  function renderPaymentMethods() {
    const { dom } = getModules();
    dom.paymentMethodButtons.forEach((button) => {
      const isSelected = button.dataset.paymentMethod === paymentDraft.payment.method;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function canSubmitPayment() {
    const state = buildPaymentState();
    return Boolean(
      state.address.roadAddress &&
        state.deliveryTime &&
        state.contact.phone.replace(/\D/g, "").length >= 10 &&
        state.payment.method,
    );
  }

  function updatePaymentState() {
    const { dom, state } = getModules();
    const paymentState = buildPaymentState();
    state.setPaymentState(paymentState);
    savePaymentDraft(paymentState);

    const isReady = canSubmitPayment();
    if (dom.paymentSubmitButton) {
      dom.paymentSubmitButton.disabled = !isReady;
      dom.paymentSubmitButton.textContent = isReady
        ? `${formatWon(paymentState.total)} 결제하기`
        : "배송시간 · 연락처 · 결제수단을 확인해주세요";
    }
  }

  function renderPaymentScene() {
    const checkoutState = getCheckoutState();
    renderOrder(checkoutState);
    renderAddress();
    renderSummary(checkoutState);
    renderPaymentMethods();
    updatePaymentState();
  }

  function showPaymentScene() {
    const { dom, state } = getModules();
    const { hero, heroContent, locationScene, checkoutPlaceholderScene, paymentScene } = dom;
    if (!hero || !paymentScene) return;

    state.setCurrentScene("payment");
    hero.classList.add("is-payment");
    hero.classList.remove("is-location", "is-checkout-placeholder", "is-nutrition-loading", "is-body-profile", "is-purpose");
    heroContent?.setAttribute("aria-hidden", "true");
    locationScene?.setAttribute("aria-hidden", "true");
    checkoutPlaceholderScene?.setAttribute("aria-hidden", "true");
    paymentScene.setAttribute("aria-hidden", "false");
    renderPaymentScene();
    window.Verden.analytics?.trackEvent("payment_view", {
      scene: "payment",
      payload: {
        checkout: state.getState().checkoutState,
      },
    });
    document.title = "주문 결제 — VERDEN";
  }

  function showCheckoutScene() {
    getModules().checkout?.showCheckoutPlaceholderScene();
  }

  function openFinalModal() {
    const { dom } = getModules();
    dom.paymentFinalModal?.classList.add("is-open");
    dom.paymentFinalModal?.setAttribute("aria-hidden", "false");
    dom.paymentFinalConfirm?.focus();
  }

  function closeFinalModal() {
    const { dom } = getModules();
    dom.paymentFinalModal?.classList.remove("is-open");
    dom.paymentFinalModal?.setAttribute("aria-hidden", "true");
  }

  async function handlePaymentSubmit() {
    updatePaymentState();
    if (!canSubmitPayment()) return;

    const { dom } = getModules();
    if (isSubmittingOrder) return;

    isSubmittingOrder = true;
    const orderPayload = buildPaymentState();

    if (dom.paymentSubmitButton) {
      dom.paymentSubmitButton.disabled = true;
      dom.paymentSubmitButton.textContent = "주문 정보를 저장하고 있어요";
    }

    window.Verden.analytics?.trackEvent("order_submit_click", {
      scene: "payment",
      payload: {
        total: orderPayload.total,
        productName: orderPayload.baseProduct?.name,
        addOnCount: orderPayload.selectedAddOns?.length || 0,
        paymentMethod: orderPayload.payment?.method || null,
      },
    });

    try {
      if (!window.Verden.orderApi?.submitOrder) {
        throw new Error("VERDEN order API module is not available.");
      }

      const result = await window.Verden.orderApi.submitOrder(orderPayload);
      console.log("VERDEN final order payload", JSON.stringify({
        ...orderPayload,
        submissionId: result?.submissionId,
        savedOrder: result?.order,
      }));
      window.Verden.analytics?.trackEvent("order_submit_success", {
        scene: "payment",
        payload: {
          submissionId: result?.submissionId,
          orderId: result?.order?.id,
          orderNumber: result?.order?.order_number,
          duplicate: Boolean(result?.duplicate),
          total: orderPayload.total,
        },
      });
      openFinalModal();
    } catch (error) {
      console.warn("VERDEN order submission failed", error);
      window.Verden.analytics?.trackEvent("order_submit_error", {
        scene: "payment",
        payload: {
          message: error.message,
          total: orderPayload.total,
        },
      });
      if (dom.paymentSubmitButton) {
        dom.paymentSubmitButton.textContent = "주문 정보를 저장하지 못했어요. 다시 시도해주세요.";
      }
    } finally {
      isSubmittingOrder = false;
      if (dom.paymentSubmitButton) {
        dom.paymentSubmitButton.disabled = !canSubmitPayment();
        if (canSubmitPayment() && !dom.paymentFinalModal?.classList.contains("is-open")) {
          window.setTimeout(updatePaymentState, 1800);
        }
      }
    }
  }

  function initializePaymentEvents() {
    const { addressEditModal, dom } = getModules();

    populateDeliveryTimeOptions();
    dom.paymentBackButton?.addEventListener("click", showCheckoutScene);
    dom.paymentAddressEditButton?.addEventListener("click", addressEditModal?.openAddressEditModal);
    dom.paymentNutritionMoreButton?.addEventListener("click", () => {
      getModules().nutritionModal?.openNutritionModal();
    });
    dom.paymentDeliveryTime?.addEventListener("change", (event) => {
      paymentDraft.deliveryTime = event.currentTarget.value;
      updatePaymentState();
    });
    dom.paymentPhoneInput?.addEventListener("input", (event) => {
      const formatted = formatPhone(event.currentTarget.value);
      event.currentTarget.value = formatted;
      paymentDraft.contact.phone = formatted;
      updatePaymentState();
    });
    dom.paymentSafeNumber?.addEventListener("change", (event) => {
      paymentDraft.contact.safeNumber = event.currentTarget.checked;
      updatePaymentState();
    });
    dom.paymentMethodButtons.forEach((button) => {
      button.addEventListener("click", () => {
        paymentDraft.payment.method = button.dataset.paymentMethod;
        paymentDraft.payment.label = METHOD_LABELS[button.dataset.paymentMethod] || button.textContent.trim();
        renderPaymentMethods();
        updatePaymentState();
      });
    });
    dom.paymentSubmitButton?.addEventListener("click", handlePaymentSubmit);
    dom.paymentFinalConfirm?.addEventListener("click", closeFinalModal);
    dom.paymentFinalBackdrop?.addEventListener("click", closeFinalModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && dom.paymentFinalModal?.classList.contains("is-open")) {
        closeFinalModal();
      }
    });
  }

  function resetPaymentUI() {
    const { dom, state } = getModules();
    paymentDraft.deliveryTime = "";
    paymentDraft.contact.phone = "";
    paymentDraft.contact.safeNumber = true;
    paymentDraft.payment.method = null;
    paymentDraft.payment.label = undefined;
    isSubmittingOrder = false;
    dom.paymentScene?.setAttribute("aria-hidden", "true");
    if (dom.paymentPhoneInput) dom.paymentPhoneInput.value = "";
    if (dom.paymentSafeNumber) dom.paymentSafeNumber.checked = true;
    if (dom.paymentDeliveryTime) dom.paymentDeliveryTime.value = "";
    closeFinalModal();
    renderPaymentMethods();
    state.setPaymentState(null);
  }

  window.Verden = window.Verden || {};
  window.Verden.payment = {
    initializePaymentEvents,
    renderPaymentScene,
    resetPaymentUI,
    showPaymentScene,
  };
})();
