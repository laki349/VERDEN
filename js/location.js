(function () {
  const ADDRESS_DRAFT_KEY = "verdenAddressDraft";
  const POSTCODE_SCRIPT_URL = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  const OUT_OF_SERVICE_MESSAGE = "현재 VERDEN은 서울특별시 지역만 배송 가능해요.";
  let postcodeScriptPromise = null;
  let hasServiceAreaError = false;
  let invalidAddressPreview = "";

  function getModules() {
    return {
      dom: window.Verden.dom,
      state: window.Verden.state,
    };
  }

  function getDisplayAddress(address) {
    return address.displayAddress || address.roadAddress || address.jibunAddress || "";
  }

  function getAddressSearchErrorElement() {
    const { dom } = getModules();
    if (!dom.addressSearchButton) return null;

    const existing = dom.addressSearchButton.parentElement?.querySelector(".address-error-message");
    if (existing) return existing;

    const errorElement = document.createElement("p");
    errorElement.className = "address-error-message";
    errorElement.hidden = true;
    errorElement.textContent = OUT_OF_SERVICE_MESSAGE;
    dom.addressSearchButton.insertAdjacentElement("afterend", errorElement);
    return errorElement;
  }

  function getAddressCandidates(address = {}) {
    return [
      address.sido,
      address.region_1depth_name,
      address.roadAddress,
      address.jibunAddress,
      address.displayAddress,
      address.address,
      address.addressName,
      address.address_name,
      address.englishAddress,
      address.roadAddressEnglish,
      address.jibunAddressEnglish,
    ]
      .filter(Boolean)
      .map((value) => String(value).trim());
  }

  function isSeoulAddress(address = {}) {
    const candidates = getAddressCandidates(address);
    return candidates.some((value) => {
      const normalized = value.toLowerCase();
      return normalized.includes("서울") || normalized.includes("seoul");
    });
  }

  function getAddressPreview(address = {}) {
    const displayAddress =
      address.displayAddress ||
      address.roadAddress ||
      address.jibunAddress ||
      address.address ||
      address.address_name ||
      "";
    return String(displayAddress).slice(0, 32);
  }

  function clearAddressError() {
    const { dom } = getModules();
    const errorElement = getAddressSearchErrorElement();

    hasServiceAreaError = false;
    invalidAddressPreview = "";
    dom.addressSearchButton?.classList.remove("is-invalid", "is-shaking");
    if (errorElement) {
      errorElement.hidden = true;
      errorElement.textContent = "";
    }
  }

  function showAddressError(address = {}) {
    const { dom } = getModules();
    const errorElement = getAddressSearchErrorElement();

    hasServiceAreaError = true;
    invalidAddressPreview = getAddressPreview(address);

    if (errorElement) {
      errorElement.textContent = OUT_OF_SERVICE_MESSAGE;
      errorElement.hidden = false;
    }

    if (dom.addressSearchButton) {
      dom.addressSearchButton.classList.remove("is-shaking");
      // Force reflow so repeated invalid selections replay the shake animation.
      void dom.addressSearchButton.offsetWidth;
      dom.addressSearchButton.classList.add("is-invalid", "is-shaking");
    }

    window.Verden.analytics?.trackEvent("address_out_of_service_area", {
      scene: "location",
      payload: {
        sido: address.sido || address.region_1depth_name || "",
        sigungu: address.sigungu || "",
        addressPreview: getAddressPreview(address),
        reason: "outside_seoul",
      },
    });
  }

  function canContinue() {
    const { state } = getModules();
    const { selectedAddress } = state.getState();

    return Boolean(
      !hasServiceAreaError &&
      getDisplayAddress(selectedAddress) &&
      isSeoulAddress(selectedAddress) &&
      selectedAddress.detailAddress?.trim() &&
      selectedAddress.addressType,
    );
  }

  function saveAddressDraft() {
    const { state } = getModules();

    try {
      localStorage.setItem(
        ADDRESS_DRAFT_KEY,
        JSON.stringify(state.getState().selectedAddress),
      );
    } catch {
      // Private browsing or a restrictive browser can make storage unavailable.
    }
  }

  function updateContinueButtonState() {
    const { dom } = getModules();
    if (!dom.locationContinueButton) return;

    const isReady = canContinue();
    dom.locationContinueButton.disabled = !isReady;
    dom.locationContinueButton.classList.toggle("is-active", isReady);
  }

  function trackBackClick(fromScene, toScene) {
    window.Verden.analytics?.trackEvent("back_click", {
      scene: fromScene,
      payload: { fromScene, toScene },
    });
  }

  function showHeroScene() {
    const { dom, state } = getModules();
    const { hero, heroContent, locationScene } = dom;
    if (!hero) return;

    trackBackClick("location", "hero");
    state.setCurrentScene("hero");
    hero.classList.remove("is-location", "is-purpose", "is-body-profile", "is-nutrition-loading", "is-checkout-placeholder", "is-payment");
    heroContent?.setAttribute("aria-hidden", "false");
    locationScene?.setAttribute("aria-hidden", "true");
    locationScene?.classList.remove("is-active");
    closePostcodeSearch();
    document.title = "VERDEN — Designed for your day.";
  }

  function updateAddressTypeButtons(addressType) {
    const { dom } = getModules();

    dom.addressTypeButtons.forEach((button) => {
      const isSelected = button.dataset.addressType === addressType;
      button.classList.toggle("is-active", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function selectAddressType(addressType) {
    const { state } = getModules();

    state.setAddressType(addressType);
    updateAddressTypeButtons(addressType);
    saveAddressDraft();
    updateContinueButtonState();
  }

  function showMapPointTooltip(point) {
    point.classList.add("is-tooltip-visible");
    window.setTimeout(() => {
      point.classList.remove("is-tooltip-visible");
    }, 1500);
  }

  function setPostcodeButtonMessage(message) {
    const { dom } = getModules();

    if (!dom.selectedAddress) return;
    if (dom.addressSearchButton?.classList.contains("has-address")) return;

    dom.selectedAddress.textContent = message;
    window.setTimeout(() => {
      if (!dom.addressSearchButton?.classList.contains("has-address")) {
        dom.selectedAddress.textContent = "배송받을 주소 검색하기";
      }
    }, 2400);
  }

  function getPostcodeConstructor() {
    return window.daum?.Postcode || null;
  }

  function waitForPostcodeConstructor(timeout = 1800) {
    const startedAt = Date.now();

    return new Promise((resolve) => {
      const check = () => {
        const Postcode = getPostcodeConstructor();
        if (Postcode) {
          resolve(Postcode);
          return;
        }

        if (Date.now() - startedAt >= timeout) {
          resolve(null);
          return;
        }

        window.setTimeout(check, 80);
      };

      check();
    });
  }

  function loadPostcodeScript() {
    const Postcode = getPostcodeConstructor();
    if (Postcode) return Promise.resolve(Postcode);

    if (postcodeScriptPromise) return postcodeScriptPromise;

    postcodeScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = `${POSTCODE_SCRIPT_URL}?v=${Date.now()}`;
      script.async = true;
      script.onload = () => resolve(getPostcodeConstructor());
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });

    return postcodeScriptPromise;
  }

  function closePostcodeSearch() {
    const { dom } = getModules();

    if (!dom.postcodeLayer || !dom.postcodeContainer) return;

    dom.postcodeLayer.classList.remove("is-open");
    dom.postcodeLayer.setAttribute("aria-hidden", "true");

    window.setTimeout(() => {
      if (!dom.postcodeLayer.classList.contains("is-open")) {
        dom.postcodeLayer.hidden = true;
        dom.postcodeContainer.replaceChildren();
      }
    }, 280);
  }

  function renderAddressState() {
    const { dom, state } = getModules();
    const { selectedAddress } = state.getState();
    const displayAddress = getDisplayAddress(selectedAddress);
    const displayAddressForUi = hasServiceAreaError && invalidAddressPreview
      ? invalidAddressPreview
      : displayAddress;
    const hasAddress = Boolean(displayAddressForUi);
    const hasValidAddress = Boolean(displayAddress) &&
      isSeoulAddress(selectedAddress) &&
      !hasServiceAreaError;
    const zonecodeText =
      hasValidAddress && selectedAddress.zonecode
        ? `우편번호 ${selectedAddress.zonecode}`
        : "";

    if (dom.selectedAddress) {
      dom.selectedAddress.textContent = hasAddress
        ? displayAddressForUi
        : "배송받을 주소 검색하기";
    }

    if (dom.selectedAddressMeta) {
      dom.selectedAddressMeta.textContent = zonecodeText;
    }

    if (dom.addressChangeText) {
      dom.addressChangeText.textContent = hasAddress ? "변경" : "";
    }

    if (dom.addressSearchPrompt) {
      dom.addressSearchPrompt.hidden = false;
    }

    if (dom.addressSearchResult) {
      dom.addressSearchResult.hidden = false;
    }

    dom.addressSearchButton?.classList.toggle("has-address", hasAddress);
    dom.addressSearchButton?.classList.toggle("is-selected", hasAddress);
    dom.locationScene?.classList.toggle("is-address-selected", hasValidAddress);

    if (dom.locationTitle) {
      dom.locationTitle.textContent = hasValidAddress
        ? "주소를 확인해주세요"
        : "주소를 적어주세요";
    }

    if (dom.locationDescription) {
      dom.locationDescription.textContent = hasValidAddress
        ? "상세주소까지 입력하면 확인할게요."
        : "배송 가능 여부를 먼저 확인할게요.";
    }

    if (dom.detailAddressWrap) {
      dom.detailAddressWrap.classList.toggle("is-visible", hasValidAddress);
      dom.detailAddressWrap.setAttribute("aria-hidden", String(!hasValidAddress));
    }

    if (dom.detailAddressInput) {
      dom.detailAddressInput.value = hasValidAddress
        ? selectedAddress.detailAddress || ""
        : "";
    }

    updateContinueButtonState();
  }

  function handleAddressComplete(data) {
    const { dom, state } = getModules();
    const currentAddressType = state.getState().selectedAddress.addressType;
    const displayAddress = data.roadAddress || data.jibunAddress || "";
    const selectedAddress = {
      zonecode: data.zonecode || "",
      roadAddress: data.roadAddress || "",
      jibunAddress: data.jibunAddress || "",
      buildingName: data.buildingName || "",
      bname: data.bname || "",
      sido: data.sido || data.region_1depth_name || "",
      sigungu: data.sigungu || "",
      displayAddress,
      detailAddress: "",
      addressType: currentAddressType,
      address: data.address || "",
      address_name: data.address_name || "",
      englishAddress: data.englishAddress || "",
      roadAddressEnglish: data.roadAddressEnglish || "",
      jibunAddressEnglish: data.jibunAddressEnglish || "",
    };

    if (!displayAddress) {
      console.warn("No address selected from postcode data:", data);
      return;
    }

    if (!isSeoulAddress(selectedAddress)) {
      showAddressError(selectedAddress);
      renderAddressState();
      updateContinueButtonState();
      closePostcodeSearch();
      return;
    }

    clearAddressError();
    state.setSelectedAddress(selectedAddress);

    saveAddressDraft();
    renderAddressState();
    window.Verden.analytics?.trackEvent("address_selected", {
      scene: "location",
      payload: {
        zonecode: data.zonecode || "",
        hasRoadAddress: Boolean(data.roadAddress),
        hasJibunAddress: Boolean(data.jibunAddress),
        hasBuildingName: Boolean(data.buildingName),
      },
    });
    closePostcodeSearch();

    window.setTimeout(() => {
      dom.detailAddressInput?.focus();
    }, 220);
  }

  async function openPostcodeSearch(event) {
    event?.preventDefault();

    const { dom } = getModules();

    setPostcodeButtonMessage("주소 검색 서비스를 불러오는 중이에요");

    const Postcode =
      getPostcodeConstructor() ||
      await waitForPostcodeConstructor() ||
      await loadPostcodeScript();

    if (!Postcode) {
      console.error("Daum/Kakao Postcode script is not loaded.");
      setPostcodeButtonMessage("주소 검색 서비스를 불러오지 못했어요");
      return;
    }

    if (dom.selectedAddress && !dom.addressSearchButton?.classList.contains("has-address")) {
      dom.selectedAddress.textContent = "배송받을 주소 검색하기";
    }

    dom.postcodeLayer.hidden = false;
    dom.postcodeLayer.setAttribute("aria-hidden", "false");
    dom.postcodeContainer.replaceChildren();
    window.requestAnimationFrame(() => {
      dom.postcodeLayer.classList.add("is-open");
    });

    new Postcode({
      oncomplete(data) {
        handleAddressComplete(data);
      },
      hideMapBtn: true,
      width: "100%",
      height: "100%",
    }).embed(dom.postcodeContainer);

    dom.closePostcodeButton?.focus();
  }

  function resetLocationUI() {
    const { dom } = getModules();

    if (dom.selectedAddress) dom.selectedAddress.textContent = "";
    if (dom.selectedAddressMeta) dom.selectedAddressMeta.textContent = "";
    if (dom.detailAddressInput) dom.detailAddressInput.value = "";

    closePostcodeSearch();
    renderAddressState();
    updateAddressTypeButtons(null);
  }

  function initializeLocationEvents() {
    const { dom, state } = getModules();

    if (!dom.addressSearchButton) {
      console.error("VERDEN address search button was not found.");
      return;
    }

    dom.addressSearchButton.addEventListener("click", openPostcodeSearch);
    dom.closePostcodeButton?.addEventListener("click", closePostcodeSearch);
    dom.postcodeBackdrop?.addEventListener("click", closePostcodeSearch);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && dom.postcodeLayer?.classList.contains("is-open")) {
        closePostcodeSearch();
      }
    });

    dom.detailAddressInput?.addEventListener("input", (event) => {
      state.setDetailAddress(event.currentTarget.value);
      if (isSeoulAddress(state.getState().selectedAddress)) {
        clearAddressError();
      }
      saveAddressDraft();
      updateContinueButtonState();
    });

    dom.addressTypeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectAddressType(button.dataset.addressType);
      });
    });

    function handleContinue(event) {
      event.preventDefault();

      const { selectedAddress } = state.getState();
      if (hasServiceAreaError || !isSeoulAddress(selectedAddress)) {
        showAddressError(hasServiceAreaError
          ? { displayAddress: invalidAddressPreview }
          : selectedAddress);
        renderAddressState();
        updateContinueButtonState();
        return;
      }

      if (!canContinue()) return;

      dom.detailAddressInput?.blur();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      saveAddressDraft();
      console.log("VERDEN address payload", selectedAddress);
      window.Verden.analytics?.trackEvent("address_lead_submit", {
        scene: "location",
        payload: {
          zonecode: selectedAddress.zonecode || "",
          addressType: selectedAddress.addressType || "",
        },
      });
      window.Verden.addressLeadsApi?.submitAddressLead(selectedAddress)
        .then((result) => {
          window.Verden.analytics?.trackEvent("address_lead_success", {
            scene: "location",
            payload: {
              duplicate: Boolean(result?.duplicate),
            },
          });
        })
        .catch((error) => {
          console.warn("VERDEN address lead save failed", error);
          window.Verden.analytics?.trackEvent("address_lead_error", {
            scene: "location",
            payload: {
              message: error?.message || "unknown",
            },
          });
        });
      window.Verden.smoothiePurpose?.showSmoothiePurposeScene();
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
      window.setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }, 80);
    }

    dom.locationForm?.addEventListener("submit", handleContinue);
    dom.locationContinueButton?.addEventListener("click", handleContinue);
    dom.locationBackButton?.addEventListener("click", showHeroScene);

    dom.mapPoints.forEach((point) => {
      point.addEventListener("click", () => showMapPointTooltip(point));
      point.addEventListener("pointerdown", () => showMapPointTooltip(point));
    });
  }

  window.Verden = window.Verden || {};
  window.Verden.location = {
    initializeLocationEvents,
    openPostcodeSearch,
    renderAddressState,
    resetLocationUI,
    showHeroScene,
  };
})();
