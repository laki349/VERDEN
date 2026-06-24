(function () {
  function openLocationScene() {
    const { dom, state } = window.Verden;
    const {
      hero,
      heroContent,
      locationScene,
    } = dom;

    if (!hero || !heroContent || !locationScene) return;
    if (hero.classList.contains("is-location")) return;

    state.setCurrentScene("location");
    hero.classList.add("is-location");
    heroContent.setAttribute("aria-hidden", "true");
    locationScene.setAttribute("aria-hidden", "false");
    locationScene.classList.add("is-active");
    document.title = "배송 가능 지역 확인 — VERDEN";
  }

  function initializeHeroEvents() {
    const { openLocationButton } = window.Verden.dom;
    if (!openLocationButton) {
      console.error("VERDEN hero CTA button was not found.");
      return;
    }

    openLocationButton.addEventListener("click", openLocationScene);
  }

  window.Verden = window.Verden || {};
  window.Verden.hero = {
    initializeHeroEvents,
    openLocationScene,
  };
})();
