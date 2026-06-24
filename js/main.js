(function () {
  function initializeHeroState() {
    const { dom, state, location } = window.Verden;
    const {
      hero,
      heroContent,
      locationScene,
    } = dom;

    state.resetState();
    hero?.classList.remove(
      "is-location",
      "is-purpose",
      "is-body-profile",
      "is-nutrition-loading",
      "is-checkout-placeholder",
      "is-payment",
    );
    heroContent?.setAttribute("aria-hidden", "false");
    locationScene?.setAttribute("aria-hidden", "true");
    locationScene?.classList.remove("is-active");
    location?.resetLocationUI();
    window.Verden.smoothiePurpose?.resetSmoothiePurposeUI();
    window.Verden.bodyProfile?.resetBodyProfileUI();
    window.Verden.nutritionLoading?.resetNutritionLoadingUI();
    window.Verden.checkoutPlaceholder?.resetCheckoutPlaceholderUI();
    window.Verden.nutritionModal?.resetNutritionModalUI();
    window.Verden.payment?.resetPaymentUI();
    window.Verden.addressEditModal?.resetAddressEditModalUI();
    document.title = "VERDEN — Designed for your day.";
  }

  function initializeApp() {
    const {
      bodyProfile,
      checkoutPlaceholder,
      hero,
      location,
      nutritionModal,
      payment,
      addressEditModal,
      smoothiePurpose,
    } = window.Verden;

    hero?.initializeHeroEvents();
    location?.initializeLocationEvents();
    smoothiePurpose?.initializeSmoothiePurposeEvents();
    bodyProfile?.initializeBodyProfileEvents();
    nutritionModal?.initializeNutritionModalEvents();
    checkoutPlaceholder?.initializeCheckoutPlaceholderEvents();
    addressEditModal?.initializeAddressEditModalEvents();
    payment?.initializePaymentEvents();
    initializeHeroState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
  } else {
    initializeApp();
  }
})();
