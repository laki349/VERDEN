(function () {
  const NUTRIENT_LABELS = {
    fiberG: ["식이섬유", "g"],
    sugarMaxG: ["당류 상한", "g"],
    omega3Mg: ["오메가3", "mg"],
    calciumMg: ["칼슘", "mg"],
    magnesiumMg: ["마그네슘", "mg"],
    zincMg: ["아연", "mg"],
    sodiumMg: ["나트륨", "mg"],
    sodiumMaxMg: ["나트륨 상한", "mg"],
    potassiumMg: ["칼륨", "mg"],
    bcaaMg: ["BCAA", "mg"],
    arginineMg: ["아르기닌", "mg"],
    creatineMg: ["크레아틴", "mg"],
    vitaminBPercent: ["비타민 B", "%"],
    vitaminDPercent: ["비타민 D", "%"],
    vitaminB12Percent: ["비타민 B12", "%"],
  };

  function getModules() {
    return {
      dom: window.Verden.dom,
      state: window.Verden.state,
    };
  }

  function roundValue(value) {
    const number = Number(value || 0);
    return Number.isInteger(number) ? number : Math.round(number * 10) / 10;
  }

  function getMacros(result) {
    const macros = result?.macros || {};
    return {
      carbohydrateG: macros.carbohydrateG ?? macros.carbs?.grams ?? 0,
      proteinG: macros.proteinG ?? macros.protein?.grams ?? 0,
      fatG: macros.fatG ?? macros.fat?.grams ?? 0,
    };
  }

  function macroText(label, value, unit = "g") {
    return `${label} ${roundValue(value)}${unit}`;
  }

  function createStat(label, value) {
    const stat = document.createElement("span");
    stat.innerHTML = `<em>${label}</em><strong>${value}</strong>`;
    return stat;
  }

  function renderNutritionModal() {
    const { dom, state } = getModules();
    const result = state.getState().nutritionResult;
    if (!result) return;

    const macros = getMacros(result);
    dom.nutritionModalSummary.replaceChildren(
      createStat("칼로리", `${roundValue(result.calories)}kcal`),
      createStat("탄수화물", `${roundValue(macros.carbohydrateG)}g`),
      createStat("단백질", `${roundValue(macros.proteinG)}g`),
      createStat("지방", `${roundValue(macros.fatG)}g`),
    );

    const detailItems = [];
    Object.entries(NUTRIENT_LABELS).forEach(([key, [label, unit]]) => {
      const value = result.nutrients?.[key];
      if (value === undefined || value === null || value === false) return;
      detailItems.push(createStat(label, `${roundValue(value)}${unit}`));
    });

    if (result.nutrients?.electrolytes) {
      detailItems.push(createStat("전해질", "포함"));
    }

    dom.nutritionModalDetails.replaceChildren(...detailItems);

    if (result.description) {
      dom.nutritionModalDescription.hidden = false;
      dom.nutritionModalDescription.innerHTML = `<h4>추천 포인트</h4><p>${result.description}</p>`;
    } else {
      dom.nutritionModalDescription.hidden = true;
      dom.nutritionModalDescription.replaceChildren();
    }

    const tagNodes = (result.tags || []).map((tag) => {
      const node = document.createElement("span");
      node.textContent = `#${tag}`;
      return node;
    });
    dom.nutritionModalTags.replaceChildren(...tagNodes);
  }

  function openNutritionModal() {
    const { dom } = getModules();
    if (!dom.nutritionModal) return;
    renderNutritionModal();
    dom.nutritionModal.classList.add("is-open");
    dom.nutritionModal.setAttribute("aria-hidden", "false");
    dom.nutritionModalClose?.focus();
  }

  function closeNutritionModal() {
    const { dom } = getModules();
    dom.nutritionModal?.classList.remove("is-open");
    dom.nutritionModal?.setAttribute("aria-hidden", "true");
  }

  function initializeNutritionModalEvents() {
    const { dom } = getModules();
    dom.nutritionModalClose?.addEventListener("click", closeNutritionModal);
    dom.nutritionModalBackdrop?.addEventListener("click", closeNutritionModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && dom.nutritionModal?.classList.contains("is-open")) {
        closeNutritionModal();
      }
    });
  }

  function resetNutritionModalUI() {
    closeNutritionModal();
  }

  window.Verden = window.Verden || {};
  window.Verden.nutritionModal = {
    closeNutritionModal,
    getMacros,
    initializeNutritionModalEvents,
    macroText,
    openNutritionModal,
    resetNutritionModalUI,
  };
})();
