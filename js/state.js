(function () {
  function createEmptyAddress() {
    return {
      zonecode: "",
      roadAddress: "",
      jibunAddress: "",
      buildingName: "",
      bname: "",
      displayAddress: "",
      detailAddress: "",
      addressType: null,
    };
  }

  const state = {
    currentScene: "hero",
    selectedAddress: createEmptyAddress(),
    smoothiePurpose: null,
    nutritionProfile: null,
    nutritionResult: null,
    checkoutState: null,
    paymentState: null,
  };

  function setSelectedAddress(address) {
    state.selectedAddress = {
      ...state.selectedAddress,
      ...address,
    };
  }

  function setDetailAddress(detailAddress) {
    state.selectedAddress.detailAddress = detailAddress;
  }

  function setAddressType(addressType) {
    state.selectedAddress.addressType = addressType;
  }

  function setCurrentScene(currentScene) {
    state.currentScene = currentScene;
  }

  function setSmoothiePurpose(smoothiePurpose) {
    state.smoothiePurpose = smoothiePurpose;
  }

  function setNutritionProfile(nutritionProfile) {
    state.nutritionProfile = nutritionProfile
      ? { ...nutritionProfile }
      : null;
  }

  function setNutritionResult(nutritionResult) {
    state.nutritionResult = nutritionResult
      ? {
          ...nutritionResult,
          macros: { ...nutritionResult.macros },
          nutrients: { ...nutritionResult.nutrients },
          tags: [...nutritionResult.tags],
          meta: { ...nutritionResult.meta },
        }
      : null;
  }

  function setCheckoutState(checkoutState) {
    state.checkoutState = checkoutState
      ? {
          ...checkoutState,
          baseProduct: { ...checkoutState.baseProduct },
          selectedAddOns: checkoutState.selectedAddOns.map((addOn) => ({ ...addOn })),
        }
      : null;
  }

  function setPaymentState(paymentState) {
    state.paymentState = paymentState
      ? {
          ...paymentState,
          contact: { ...paymentState.contact },
          payment: { ...paymentState.payment },
        }
      : null;
  }

  function resetState() {
    state.currentScene = "hero";
    state.selectedAddress = createEmptyAddress();
    state.smoothiePurpose = null;
    state.nutritionProfile = null;
    state.nutritionResult = null;
    state.checkoutState = null;
    state.paymentState = null;
  }

  function getState() {
    return {
      ...state,
      selectedAddress: { ...state.selectedAddress },
      smoothiePurpose: state.smoothiePurpose
        ? { ...state.smoothiePurpose }
        : null,
      nutritionProfile: state.nutritionProfile
        ? { ...state.nutritionProfile }
        : null,
      nutritionResult: state.nutritionResult
        ? {
            ...state.nutritionResult,
            macros: { ...state.nutritionResult.macros },
            nutrients: { ...state.nutritionResult.nutrients },
            tags: [...state.nutritionResult.tags],
            meta: { ...state.nutritionResult.meta },
          }
        : null,
      checkoutState: state.checkoutState
        ? {
            ...state.checkoutState,
            baseProduct: { ...state.checkoutState.baseProduct },
            selectedAddOns: state.checkoutState.selectedAddOns.map((addOn) => ({ ...addOn })),
          }
        : null,
      paymentState: state.paymentState
        ? {
            ...state.paymentState,
            contact: { ...state.paymentState.contact },
            payment: { ...state.paymentState.payment },
          }
        : null,
    };
  }

  window.Verden = window.Verden || {};
  window.Verden.state = {
    getState,
    resetState,
    setAddressType,
    setCheckoutState,
    setCurrentScene,
    setDetailAddress,
    setNutritionProfile,
    setNutritionResult,
    setPaymentState,
    setSelectedAddress,
    setSmoothiePurpose,
  };
})();
