(function () {
  const ADDRESS_DRAFT_KEY = "verdenAddressDraft";
  const POSTCODE_SCRIPT_URL = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  let postcodeScriptPromise = null;

  function getModules() {
    return {
      dom: window.Verden.dom,
      state: window.Verden.state,
    };
  }

  function getDisplayAddress(address) {
    return address.displayAddress || address.roadAddress || address.jibunAddress || "";
  }

  function canContinue() {
    const { state } = getModules();
    const { selectedAddress } = state.getState();

    return Boolean(
      getDisplayAddress(selectedAddress) &&
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
    const hasAddress = Boolean(displayAddress);
    const zonecodeText =
      hasAddress && selectedAddress.zonecode
        ? `우편번호 ${selectedAddress.zonecode}`
        : "";

    if (dom.selectedAddress) {
      dom.selectedAddress.textContent = hasAddress
        ? displayAddress
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
    dom.locationScene?.classList.toggle("is-address-selected", hasAddress);

    if (dom.locationTitle) {
      dom.locationTitle.textContent = hasAddress
        ? "주소를 확인해주세요"
        : "주소를 적어주세요";
    }

    if (dom.locationDescription) {
      dom.locationDescription.textContent = hasAddress
        ? "상세주소까지 입력하면 확인할게요."
        : "배송 가능 여부를 먼저 확인할게요.";
    }

    if (dom.detailAddressWrap) {
      dom.detailAddressWrap.classList.toggle("is-visible", hasAddress);
      dom.detailAddressWrap.setAttribute("aria-hidden", String(!hasAddress));
    }

    if (dom.detailAddressInput) {
      dom.detailAddressInput.value = hasAddress
        ? selectedAddress.detailAddress || ""
        : "";
    }

    updateContinueButtonState();
  }

  function handleAddressComplete(data) {
    const { dom, state } = getModules();
    const currentAddressType = state.getState().selectedAddress.addressType;
    const displayAddress = data.roadAddress || data.jibunAddress || "";

    if (!displayAddress) {
      console.warn("No address selected from postcode data:", data);
      return;
    }

    state.setSelectedAddress({
      zonecode: data.zonecode || "",
      roadAddress: data.roadAddress || "",
      jibunAddress: data.jibunAddress || "",
      buildingName: data.buildingName || "",
      bname: data.bname || "",
      displayAddress,
      detailAddress: "",
      addressType: currentAddressType,
    });

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
      if (!canContinue()) return;

      dom.detailAddressInput?.blur();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      saveAddressDraft();
      console.log("VERDEN address payload", selectedAddress);
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
  };
})();
