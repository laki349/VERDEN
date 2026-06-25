(function () {
  const PROFILE_STORAGE_KEY = "verdenNutritionProfile";
  const RESULT_STORAGE_KEY = "verdenNutritionResult";

  const FIELD_RULES = {
    age: {
      min: 14,
      max: 80,
      message: "나이는 14세부터 80세까지 입력할 수 있어요.",
    },
    heightCm: {
      min: 130,
      max: 220,
      message: "키는 130cm부터 220cm까지 입력할 수 있어요.",
    },
    weightKg: {
      min: 35,
      max: 180,
      message: "몸무게는 35kg부터 180kg까지 입력할 수 있어요.",
    },
  };

  function getModules() {
    return {
      dom: window.Verden.dom,
      engine: window.Verden.nutritionEngine,
      smoothiePurpose: window.Verden.smoothiePurpose,
      state: window.Verden.state,
    };
  }

  function readProfileInputs() {
    const { dom } = getModules();

    return {
      age: Number(dom.bodyAgeInput?.value),
      heightCm: Number(dom.bodyHeightInput?.value),
      weightKg: Number(dom.bodyWeightInput?.value),
    };
  }

  function validateProfile(profile) {
    const errors = {};

    Object.entries(FIELD_RULES).forEach(([key, rule]) => {
      const value = profile[key];
      if (!Number.isFinite(value) || value <= 0) {
        errors[key] = "";
        return;
      }

      if (key === "age" && !Number.isInteger(value)) {
        errors[key] = "나이는 정수로 입력해주세요.";
        return;
      }

      if (value < rule.min || value > rule.max) {
        errors[key] = rule.message;
      }
    });

    return errors;
  }

  function isProfileComplete(profile, errors) {
    return Boolean(
      Number.isFinite(profile.age) &&
        Number.isFinite(profile.heightCm) &&
        Number.isFinite(profile.weightKg) &&
        profile.age > 0 &&
        profile.heightCm > 0 &&
        profile.weightKg > 0 &&
        Object.keys(errors).length === 0,
    );
  }

  function setFieldError(element, message) {
    if (!element) return;
    element.textContent = message || "";
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Private browsing or a restrictive browser can make storage unavailable.
    }
  }

  function saveNutritionResult(result) {
    try {
      localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
    } catch {
      // Private browsing or a restrictive browser can make storage unavailable.
    }
  }

  function renderBodyProfileState() {
    const { dom } = getModules();
    const profile = readProfileInputs();
    const errors = validateProfile(profile);
    const complete = isProfileComplete(profile, errors);

    setFieldError(dom.bodyAgeError, errors.age);
    setFieldError(dom.bodyHeightError, errors.heightCm);
    setFieldError(dom.bodyWeightError, errors.weightKg);

    if (dom.bodyProfileError) {
      const hasVisibleError = Object.values(errors).some(Boolean);
      dom.bodyProfileError.textContent = hasVisibleError
        ? "입력값을 한 번만 확인해주세요."
        : "";
    }

    if (dom.bodyProfileSubmitButton) {
      dom.bodyProfileSubmitButton.disabled = !complete;
      dom.bodyProfileSubmitButton.classList.toggle("is-active", complete);
    }

    return { complete, errors, profile };
  }

  function showBodyProfileScene() {
    const { dom, state } = getModules();
    const { hero, smoothiePurposeScene, bodyProfileScene, nutritionLoadingScene, checkoutPlaceholderScene, paymentScene } = dom;

    if (!hero || !bodyProfileScene) return;

    state.setCurrentScene("bodyProfile");
    hero.classList.add("is-body-profile");
    hero.classList.remove("is-purpose", "is-nutrition-loading", "is-checkout-placeholder", "is-payment");
    smoothiePurposeScene?.setAttribute("aria-hidden", "true");
    bodyProfileScene.setAttribute("aria-hidden", "false");
    nutritionLoadingScene?.setAttribute("aria-hidden", "true");
    checkoutPlaceholderScene?.setAttribute("aria-hidden", "true");
    paymentScene?.setAttribute("aria-hidden", "true");
    renderBodyProfileState();
    document.title = "신체정보 입력 — VERDEN";
  }

  function handleBackToPurpose() {
    getModules().smoothiePurpose?.showSmoothiePurposeScene();
  }

  function handleSubmit(event) {
    event.preventDefault();

    const { engine, state } = getModules();
    const { complete, profile } = renderBodyProfileState();
    const smoothiePurpose = state.getState().smoothiePurpose;

    if (!complete || !smoothiePurpose) return;

    const normalizedProfile = {
      age: Math.round(profile.age),
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
    };
    const nutritionResult = engine.calculateNutritionForFunnel({
      profile: normalizedProfile,
      smoothiePurpose,
    });

    state.setNutritionProfile(normalizedProfile);
    state.setNutritionResult(nutritionResult);
    saveProfile(normalizedProfile);
    saveNutritionResult(nutritionResult);
    console.log("VERDEN nutrition payload", {
      nutritionProfile: normalizedProfile,
      nutritionResult,
    });
    window.Verden.analytics?.trackEvent("body_profile_submitted", {
      scene: "bodyProfile",
      payload: {
        age: normalizedProfile.age,
        heightCm: normalizedProfile.heightCm,
        weightKg: normalizedProfile.weightKg,
        smoothiePurpose,
      },
    });
    window.Verden.nutritionLoading?.startNutritionLoading();
  }

  function initializeBodyProfileEvents() {
    const { dom } = getModules();
    const inputs = [
      dom.bodyAgeInput,
      dom.bodyHeightInput,
      dom.bodyWeightInput,
    ].filter(Boolean);

    dom.bodyProfileBackButton?.addEventListener("click", handleBackToPurpose);
    dom.bodyProfileForm?.addEventListener("submit", handleSubmit);
    inputs.forEach((input) => {
      input.addEventListener("input", renderBodyProfileState);
    });
  }

  function resetBodyProfileUI() {
    const { dom } = getModules();
    dom.bodyProfileScene?.setAttribute("aria-hidden", "true");
    [dom.bodyAgeInput, dom.bodyHeightInput, dom.bodyWeightInput].forEach((input) => {
      if (input) input.value = "";
    });
    [dom.bodyAgeError, dom.bodyHeightError, dom.bodyWeightError, dom.bodyProfileError].forEach((element) => {
      if (element) element.textContent = "";
    });
    if (dom.bodyProfileSubmitButton) {
      dom.bodyProfileSubmitButton.disabled = true;
      dom.bodyProfileSubmitButton.classList.remove("is-active");
    }
  }

  window.Verden = window.Verden || {};
  window.Verden.bodyProfile = {
    initializeBodyProfileEvents,
    renderBodyProfileState,
    resetBodyProfileUI,
    showBodyProfileScene,
  };
})();
