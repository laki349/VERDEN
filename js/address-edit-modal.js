(function () {
  const ADDRESS_DRAFT_KEY = "verdenAddressDraft";
  const POSTCODE_SCRIPT_URL = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  let postcodeScriptPromise = null;
  let editingAddressDraft = null;

  function getModules() {
    return {
      dom: window.Verden.dom,
      state: window.Verden.state,
      location: window.Verden.location,
      payment: window.Verden.payment,
    };
  }

  function cloneAddress(address) {
    return {
      zonecode: address?.zonecode || "",
      roadAddress: address?.roadAddress || "",
      jibunAddress: address?.jibunAddress || "",
      buildingName: address?.buildingName || "",
      bname: address?.bname || "",
      sido: address?.sido || "",
      sigungu: address?.sigungu || "",
      displayAddress: address?.displayAddress || address?.roadAddress || address?.jibunAddress || "",
      detailAddress: address?.detailAddress || "",
      addressType: address?.addressType || null,
    };
  }

  function getDisplayAddress(address) {
    return address?.displayAddress || address?.roadAddress || address?.jibunAddress || "";
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

  function canSaveDraft() {
    return Boolean(
      getDisplayAddress(editingAddressDraft) &&
        editingAddressDraft?.detailAddress?.trim() &&
        editingAddressDraft?.addressType,
    );
  }

  function renderAddressTypeButtons() {
    const { dom } = getModules();
    dom.editAddressTypeButtons.forEach((button) => {
      const isSelected = button.dataset.editAddressType === editingAddressDraft?.addressType;
      button.classList.toggle("is-active", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function renderDraft() {
    const { dom } = getModules();
    const displayAddress = getDisplayAddress(editingAddressDraft);

    if (dom.editSelectedAddressText) {
      dom.editSelectedAddressText.textContent = displayAddress || "주소 검색하기";
    }

    if (dom.editSelectedZonecodeText) {
      dom.editSelectedZonecodeText.textContent =
        displayAddress && editingAddressDraft?.zonecode
          ? `우편번호 ${editingAddressDraft.zonecode}`
          : "";
    }

    if (dom.editDetailAddressInput) {
      dom.editDetailAddressInput.value = editingAddressDraft?.detailAddress || "";
    }

    renderAddressTypeButtons();

    if (dom.addressEditSaveButton) {
      dom.addressEditSaveButton.disabled = !canSaveDraft();
    }
  }

  function closeEditPostcode() {
    const { dom } = getModules();
    dom.addressEditPostcode?.classList.remove("is-open");
    dom.addressEditPostcode?.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      if (!dom.addressEditPostcode?.classList.contains("is-open")) {
        dom.addressEditPostcodeContainer?.replaceChildren();
      }
    }, 260);
  }

  function handlePostcodeComplete(data) {
    const displayAddress = data.roadAddress || data.jibunAddress || "";
    if (!displayAddress) return;

    editingAddressDraft = {
      ...editingAddressDraft,
      zonecode: data.zonecode || "",
      roadAddress: data.roadAddress || "",
      jibunAddress: data.jibunAddress || "",
      buildingName: data.buildingName || "",
      bname: data.bname || "",
      sido: data.sido || "",
      sigungu: data.sigungu || "",
      displayAddress,
      detailAddress: "",
    };

    closeEditPostcode();
    renderDraft();

    window.setTimeout(() => {
      getModules().dom.editDetailAddressInput?.focus();
    }, 180);
  }

  async function openEditPostcode(event) {
    event?.preventDefault();
    const { dom } = getModules();

    const Postcode =
      getPostcodeConstructor() ||
      await waitForPostcodeConstructor() ||
      await loadPostcodeScript();

    if (!Postcode) {
      console.error("Daum/Kakao Postcode script is not loaded.");
      return;
    }

    dom.addressEditPostcodeContainer?.replaceChildren();
    dom.addressEditPostcode?.classList.add("is-open");
    dom.addressEditPostcode?.setAttribute("aria-hidden", "false");

    new Postcode({
      oncomplete(data) {
        handlePostcodeComplete(data);
      },
      hideMapBtn: true,
      width: "100%",
      height: "100%",
    }).embed(dom.addressEditPostcodeContainer);

    dom.addressEditPostcodeClose?.focus();
  }

  function openAddressEditModal() {
    const { dom, state } = getModules();
    editingAddressDraft = cloneAddress(state.getState().selectedAddress);
    renderDraft();
    closeEditPostcode();
    dom.addressEditModal?.classList.add("is-open");
    dom.addressEditModal?.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
      dom.editAddressSearchButton?.focus();
    }, 80);
  }

  function closeAddressEditModal() {
    const { dom } = getModules();
    editingAddressDraft = null;
    closeEditPostcode();
    dom.addressEditModal?.classList.remove("is-open");
    dom.addressEditModal?.setAttribute("aria-hidden", "true");
  }

  function commitAddressEdit() {
    if (!canSaveDraft()) return;

    const { state, location, payment } = getModules();
    const nextAddress = cloneAddress(editingAddressDraft);
    state.setSelectedAddress(nextAddress);

    try {
      localStorage.setItem(ADDRESS_DRAFT_KEY, JSON.stringify(nextAddress));
    } catch {
      // Private browsing or a restrictive browser can make storage unavailable.
    }

    location?.renderAddressState();
    payment?.renderPaymentScene();
    closeAddressEditModal();
  }

  function initializeAddressEditModalEvents() {
    const { dom } = getModules();

    dom.editAddressSearchButton?.addEventListener("click", openEditPostcode);
    dom.addressEditPostcodeClose?.addEventListener("click", closeEditPostcode);
    dom.addressEditClose?.addEventListener("click", closeAddressEditModal);
    dom.addressEditBackdrop?.addEventListener("click", closeAddressEditModal);
    dom.addressEditSaveButton?.addEventListener("click", commitAddressEdit);

    dom.editDetailAddressInput?.addEventListener("input", (event) => {
      if (!editingAddressDraft) return;
      editingAddressDraft.detailAddress = event.currentTarget.value;
      renderDraft();
    });

    dom.editAddressTypeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (!editingAddressDraft) return;
        editingAddressDraft.addressType = button.dataset.editAddressType;
        renderDraft();
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (dom.addressEditPostcode?.classList.contains("is-open")) {
        closeEditPostcode();
        return;
      }
      if (dom.addressEditModal?.classList.contains("is-open")) {
        closeAddressEditModal();
      }
    });
  }

  function resetAddressEditModalUI() {
    closeAddressEditModal();
  }

  window.Verden = window.Verden || {};
  window.Verden.addressEditModal = {
    initializeAddressEditModalEvents,
    openAddressEditModal,
    resetAddressEditModalUI,
  };
})();
