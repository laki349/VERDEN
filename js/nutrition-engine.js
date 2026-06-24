(function () {
  const nutritionConfig = {
    activityFactors: {
      low: 1.2,
      moderate: 1.45,
      high: 1.65,
    },
    weightAdjustment: {
      referenceWeightKg: 65,
      energyRatio: { minimum: 0.75, maximum: 1.35 },
      macroRatio: { minimum: 0.8, maximum: 1.3 },
      micronutrientRatio: { minimum: 0.9, maximum: 1.15 },
    },
    ageProteinMultipliers: {
      under18: 1,
      age18to29: 1,
      age30to39: 1,
      age40to49: 1.05,
      age50to59: 1.08,
      age60to69: 1.1,
      age70Plus: 1.1,
    },
    ageNutrientAdjustments: {
      under18: { fiberG: 0, calciumMg: 50, magnesiumMg: 0, vitaminDPercent: 5, vitaminB12Percent: 0 },
      age18to29: { fiberG: 0, calciumMg: 0, magnesiumMg: 0, vitaminDPercent: 0, vitaminB12Percent: 0 },
      age30to39: { fiberG: 0, calciumMg: 0, magnesiumMg: 0, vitaminDPercent: 0, vitaminB12Percent: 0 },
      age40to49: { fiberG: 1, calciumMg: 30, magnesiumMg: 10, vitaminDPercent: 5, vitaminB12Percent: 0 },
      age50to59: { fiberG: 1, calciumMg: 50, magnesiumMg: 20, vitaminDPercent: 10, vitaminB12Percent: 5 },
      age60to69: { fiberG: 2, calciumMg: 80, magnesiumMg: 30, vitaminDPercent: 15, vitaminB12Percent: 10 },
      age70Plus: { fiberG: 2, calciumMg: 100, magnesiumMg: 30, vitaminDPercent: 20, vitaminB12Percent: 15 },
    },
    ageWarnings: {
      under18: "성장기에는 연령과 성장 상태에 따라 필요한 영양 구성이 달라질 수 있습니다.",
      age70Plus: "고령층은 질환, 소화 상태, 복용 약물 등에 따라 적절한 영양 구성이 달라질 수 있습니다.",
    },
    ageTags: {
      age40to49: "연령대별 단백질 균형",
      age50to59: "단백질·미네랄 강화 설계",
      age60to69: "단백질·칼슘·비타민 균형 설계",
      age70Plus: "단백질·미세영양소 균형 설계",
    },
    regularMeal: {
      calorieConfig: {
        diet: { tdeeRatio: 0.18, minimum: 280, maximum: 390 },
        standard: { tdeeRatio: 0.22, minimum: 330, maximum: 480 },
      },
      proteinConfig: {
        diet: { factor: 0.44, minimumG: 22, maximumG: 38 },
        standard: { factor: 0.48, minimumG: 24, maximumG: 45 },
      },
      fatRatios: {
        diet: 0.34,
        standard: 0.32,
      },
      weightMinimumFatPerKg: {
        diet: 0.18,
        standard: 0.2,
      },
      carbohydrateRatioRanges: {
        diet: { minimum: 0.27, maximum: 0.33 },
        standard: { minimum: 0.3, maximum: 0.36 },
      },
      fatRatioRanges: {
        diet: { minimum: 0.32, maximum: 0.37 },
        standard: { minimum: 0.3, maximum: 0.35 },
      },
      nutrientTargets: {
        diet: {
          fiberG: 8,
          sugarMaxG: 8,
          omega3Mg: 700,
          sodiumMaxMg: 280,
          potassiumMg: 550,
          calciumMg: 200,
          magnesiumMg: 80,
          vitaminDPercent: 15,
          vitaminB12Percent: 15,
        },
        standard: {
          fiberG: 8,
          sugarMaxG: 10,
          omega3Mg: 800,
          sodiumMaxMg: 350,
          potassiumMg: 650,
          calciumMg: 250,
          magnesiumMg: 100,
          vitaminDPercent: 20,
          vitaminB12Percent: 20,
        },
      },
      descriptions: {
        diet: "열량과 탄수화물은 가볍게 줄이고, 단백질과 식이섬유를 채운 다이어트 한 끼입니다.",
        standard: "과도한 탄수화물은 줄이고 단백질과 건강한 지방을 균형 있게 구성한 일상 식사대용입니다.",
      },
    },
    postWorkoutMeal: {
      calorieConfig: {
        diet: { tdeeRatio: 0.23, minimum: 350, maximum: 500, absoluteMaximum: 560 },
        bulkUp: { tdeeRatio: 0.31, minimum: 520, maximum: 720, absoluteMaximum: 850 },
      },
      proteinConfig: {
        diet: { factor: 0.55, minimumG: 28, maximumG: 48 },
        bulkUp: { factor: 0.62, minimumG: 35, maximumG: 58 },
      },
      fatRatios: {
        diet: 0.21,
        bulkUp: 0.24,
      },
      minimumFatRatios: {
        diet: 0.17,
        bulkUp: 0.19,
      },
      weightMinimumFatPerKg: {
        diet: 0.15,
        bulkUp: 0.18,
      },
      intensityAdjustments: {
        diet: { light: 0, moderate: 20, intense: 40 },
        bulkUp: { light: 0, moderate: 40, intense: 80 },
      },
      durationAdjustments: {
        diet: { under45: 0, from45To75: 15, over75: 35 },
        bulkUp: { under45: 0, from45To75: 30, over75: 70 },
      },
      carbohydrateFactors: {
        diet: {
          intensity: { light: 0.4, moderate: 0.55, intense: 0.7 },
          duration: { under45: 0, from45To75: 0.08, over75: 0.15 },
        },
        bulkUp: {
          intensity: { light: 0.65, moderate: 0.85, intense: 1.05 },
          duration: { under45: 0, from45To75: 0.15, over75: 0.3 },
        },
      },
      nutrientMultipliers: {
        intensity: { light: 0.95, moderate: 1, intense: 1.1 },
        duration: { under45: 0.95, from45To75: 1, over75: 1.1 },
      },
      nutrientTargets: {
        diet: {
          fiberG: 6,
          sugarMaxG: 10,
          sodiumMg: 280,
          potassiumMg: 500,
          magnesiumMg: 90,
          calciumMg: 220,
          bcaaMg: 5000,
          arginineMg: 1500,
          vitaminBPercent: 20,
          electrolytes: true,
        },
        bulkUp: {
          fiberG: 7,
          sugarMaxG: 18,
          sodiumMg: 350,
          potassiumMg: 650,
          magnesiumMg: 120,
          calciumMg: 300,
          zincMg: 3,
          bcaaMg: 6000,
          arginineMg: 2000,
          creatineMg: 3000,
          vitaminBPercent: 25,
          electrolytes: true,
        },
      },
      functionalIngredients: {
        bcaa: {
          diet: { lowWeightThresholdKg: 55, highWeightThresholdKg: 80, lowG: 4, mediumG: 5, highG: 6, intenseOrLongAddG: 1, minimumG: 4, maximumG: 6 },
          bulkUp: { lowWeightThresholdKg: 55, highWeightThresholdKg: 80, lowG: 5, mediumG: 6, highG: 7, intenseOrLongAddG: 1, minimumG: 5, maximumG: 8 },
        },
        arginine: {
          diet: { lowWeightThresholdKg: 55, highWeightThresholdKg: 80, lowMg: 1200, mediumMg: 1500, highMg: 1800, intenseOrLongAddMg: 300, minimumMg: 1200, maximumMg: 2200 },
          bulkUp: { lowWeightThresholdKg: 55, highWeightThresholdKg: 80, lowMg: 1800, mediumMg: 2200, highMg: 2500, intenseOrLongAddMg: 500, minimumMg: 1800, maximumMg: 3000 },
        },
      },
      descriptions: {
        diet: "감량 목표를 유지하면서 운동 후 필요한 단백질과 탄수화물을 보충할 수 있도록 설계한 한 끼입니다.",
        bulkUp: "운동 후 충분한 열량과 단백질, 탄수화물을 제공하도록 설계한 벌크업용 식사대용입니다.",
      },
      tags: {
        diet: "운동 후 다이어트 균형",
        bulkUp: "운동 후 벌크업 균형",
      },
    },
    intakeTimingTags: {
      within30: "운동 후 빠른 식사대용",
      within60: "권장 식사대용 구간",
      within120: "운동 후 한 끼 보충",
    },
    tags: {
      lowSugar: ["저당 과일 배합", "무가당 베이스 권장"],
      highSatiety: ["귀리 강화", "치아시드 배합", "포만감 중심 설계"],
      lactoseSensitive: ["락토프리 베이스", "식물성 단백질 권장"],
      nutFree: ["견과류 제외 배합"],
      caffeineFree: ["카페인 프리 배합"],
    },
    specialConditionAdjustments: {
      highProteinMultiplier: 1.1,
      regularHighSatietyFiberG: 2,
      postWorkoutHighSatietyFiberG: 1,
    },
  };

  const DEFAULT_SPECIAL_CONDITIONS = {
    lactoseSensitive: false,
    highProtein: false,
    lowSugar: false,
    highSatiety: false,
    nutFree: false,
    caffeineFree: false,
  };

  const DEFAULTS = {
    // TODO: 성별, 활동량, 운동강도, 운동시간, 섭취 타이밍은 추후 질문 화면에서 직접 받도록 확장한다.
    gender: "male",
    activity: "moderate",
    regularMealGoal: "standard",
    postWorkoutMealGoal: "bulkUp",
    workoutIntensity: "moderate",
    workoutDuration: "from45To75",
    intakeTiming: "within60",
    specialNotes: DEFAULT_SPECIAL_CONDITIONS,
  };

  function calculateNutritionForFunnel({ profile, smoothiePurpose, overrides = {} }) {
    const normalizedProfile = {
      age: Math.round(Number(profile.age)),
      heightCm: Number(profile.heightCm),
      weightKg: Number(profile.weightKg),
    };
    const options = {
      ...DEFAULTS,
      ...overrides,
      specialNotes: {
        ...DEFAULT_SPECIAL_CONDITIONS,
        ...(overrides.specialNotes || {}),
      },
    };
    const purposeType = smoothiePurpose?.type;
    const commonInput = {
      gender: options.gender,
      age: normalizedProfile.age,
      heightCm: normalizedProfile.heightCm,
      weightKg: normalizedProfile.weightKg,
      activity: options.activity,
      specialNotes: options.specialNotes,
    };
    const input =
      purposeType === "proteinRecovery"
        ? {
            ...commonInput,
            calculatorType: "postWorkoutMeal",
            goal: options.postWorkoutMealGoal,
            intensity: options.workoutIntensity,
            duration: options.workoutDuration,
            intakeTime: options.intakeTiming,
          }
        : {
            ...commonInput,
            calculatorType: "regularMeal",
            goal: purposeType === "diet" ? "diet" : options.regularMealGoal,
          };

    return calculateNutrition(input);
  }

  function calculateNutrition(input) {
    const errors = validateCommonInput(input);
    if (Object.keys(errors).length > 0) {
      throw new Error(Object.values(errors).join(" "));
    }

    return input.calculatorType === "regularMeal"
      ? calculateRegularMeal(input)
      : calculatePostWorkoutMeal(input);
  }

  function calculateRegularMeal(input) {
    const ageGroup = getAgeGroup(input.age);
    const ageProteinMultiplier = nutritionConfig.ageProteinMultipliers[ageGroup];
    const weightRatios = calculateWeightRatios(input.weightKg);
    const bmr = calculateBmr(input);
    const tdee = bmr * nutritionConfig.activityFactors[input.activity];
    const calorieConfig = nutritionConfig.regularMeal.calorieConfig[input.goal];
    const proteinConfig = nutritionConfig.regularMeal.proteinConfig[input.goal];
    const rawTargetCalories = tdee * calorieConfig.tdeeRatio;
    const targetCalories = clamp(rawTargetCalories, calorieConfig.minimum, calorieConfig.maximum);
    const protein = calculateProteinG({
      weightKg: input.weightKg,
      factor: proteinConfig.factor,
      minimumG: proteinConfig.minimumG,
      maximumG: proteinConfig.maximumG,
      ageProteinMultiplier,
      highProtein: input.specialNotes.highProtein,
    });
    const ratioBasedFatG = (targetCalories * nutritionConfig.regularMeal.fatRatios[input.goal]) / 9;
    const weightBasedMinimumFatG = input.weightKg * nutritionConfig.regularMeal.weightMinimumFatPerKg[input.goal];
    const maximumFatG = (targetCalories * nutritionConfig.regularMeal.fatRatioRanges[input.goal].maximum) / 9;
    const fatG = Math.min(Math.max(ratioBasedFatG, weightBasedMinimumFatG), maximumFatG);
    const macroResult = reconcileRegularMealMacros({
      targetCalories,
      initialProteinG: protein.value,
      initialFatG: fatG,
      goal: input.goal,
    });
    const nutrients = applyNutrientAdjustments(
      nutritionConfig.regularMeal.nutrientTargets[input.goal],
      ageGroup,
      input.specialNotes.highSatiety ? nutritionConfig.specialConditionAdjustments.regularHighSatietyFiberG : 0,
      input.weightKg,
    );

    return {
      calculatorType: "regularMeal",
      goal: input.goal,
      calories: macroResult.calories,
      macros: {
        carbohydrateG: macroResult.carbohydrateG,
        proteinG: macroResult.proteinG,
        fatG: macroResult.fatG,
        carbohydratePercent: macroResult.ratios.carbohydratePercent,
        proteinPercent: macroResult.ratios.proteinPercent,
        fatPercent: macroResult.ratios.fatPercent,
      },
      nutrients,
      tags: createTags(input, ageGroup),
      description: nutritionConfig.regularMeal.descriptions[input.goal],
      warning: createAgeWarning(ageGroup),
      meta: createMeta({
        bmr,
        tdee,
        ageGroup,
        ageProteinMultiplier,
        weightRatios,
        rawTargetCalories,
        calorieClampApplied: targetCalories !== rawTargetCalories,
        rawProteinG: protein.raw,
        proteinClampApplied: protein.clampApplied,
      }),
    };
  }

  function reconcileRegularMealMacros({
    targetCalories,
    initialProteinG,
    initialFatG,
    goal,
  }) {
    const proteinConfig = nutritionConfig.regularMeal.proteinConfig[goal];
    const carbRange = nutritionConfig.regularMeal.carbohydrateRatioRanges[goal];
    const fatRange = nutritionConfig.regularMeal.fatRatioRanges[goal];
    const maxCarbG = (targetCalories * carbRange.maximum) / 4;
    const relaxedMaxCarbG = (targetCalories * (carbRange.maximum + 0.02)) / 4;
    let proteinG = initialProteinG;
    let fatG = initialFatG;
    let carbohydrateG = Math.min(Math.max((targetCalories - proteinG * 4 - fatG * 9) / 4, 0), maxCarbG);
    let deficitCalories = targetCalories - macroCaloriesFrom({ carbohydrateG, proteinG, fatG });

    if (deficitCalories > 0) {
      const addProteinG = Math.min(proteinConfig.maximumG - proteinG, deficitCalories / 4);
      proteinG += Math.max(0, addProteinG);
      deficitCalories = targetCalories - macroCaloriesFrom({ carbohydrateG, proteinG, fatG });
    }

    if (deficitCalories > 0) {
      const maxFatG = (targetCalories * fatRange.maximum) / 9;
      const addFatG = Math.min(maxFatG - fatG, deficitCalories / 9);
      fatG += Math.max(0, addFatG);
      deficitCalories = targetCalories - macroCaloriesFrom({ carbohydrateG, proteinG, fatG });
    }

    if (deficitCalories > 0) {
      const addCarbG = Math.min(relaxedMaxCarbG - carbohydrateG, deficitCalories / 4);
      carbohydrateG += Math.max(0, addCarbG);
    }

    let result = finalizeMacroResult({ carbohydrateG, proteinG, fatG });
    const maximumCarbohydratePercent = Math.round(carbRange.maximum * 100);

    while (result.ratios.carbohydratePercent > maximumCarbohydratePercent && result.carbohydrateG > 0) {
      result = finalizeMacroResult({
        carbohydrateG: result.carbohydrateG - 1,
        proteinG: result.proteinG,
        fatG: result.fatG,
      });
    }

    while (result.calories > roundKcal(targetCalories) && result.carbohydrateG > 0) {
      result = finalizeMacroResult({
        carbohydrateG: result.carbohydrateG - 1,
        proteinG: result.proteinG,
        fatG: result.fatG,
      });
    }

    return result;
  }

  function calculatePostWorkoutMeal(input) {
    const ageGroup = getAgeGroup(input.age);
    const ageProteinMultiplier = nutritionConfig.ageProteinMultipliers[ageGroup];
    const weightRatios = calculateWeightRatios(input.weightKg);
    const bmr = calculateBmr(input);
    const tdee = bmr * nutritionConfig.activityFactors[input.activity];
    const calorieConfig = nutritionConfig.postWorkoutMeal.calorieConfig[input.goal];
    const proteinConfig = nutritionConfig.postWorkoutMeal.proteinConfig[input.goal];
    const rawTargetCalories = tdee * calorieConfig.tdeeRatio;
    const targetCalories = clamp(rawTargetCalories, calorieConfig.minimum, calorieConfig.maximum);
    let finalCalories = clamp(
      targetCalories
        + nutritionConfig.postWorkoutMeal.intensityAdjustments[input.goal][input.intensity]
        + nutritionConfig.postWorkoutMeal.durationAdjustments[input.goal][input.duration],
      calorieConfig.minimum,
      calorieConfig.absoluteMaximum,
    );
    const protein = calculateProteinG({
      weightKg: input.weightKg,
      factor: proteinConfig.factor,
      minimumG: proteinConfig.minimumG,
      maximumG: proteinConfig.maximumG,
      ageProteinMultiplier,
      highProtein: input.specialNotes.highProtein,
    });
    const ratioBasedFatG = (finalCalories * nutritionConfig.postWorkoutMeal.fatRatios[input.goal]) / 9;
    const weightBasedMinimumFatG = input.weightKg * nutritionConfig.postWorkoutMeal.weightMinimumFatPerKg[input.goal];
    const maximumFatG = (finalCalories * 0.32) / 9;
    let fatG = Math.min(Math.max(ratioBasedFatG, weightBasedMinimumFatG), maximumFatG);
    let carbohydrateG = Math.max((finalCalories - protein.value * 4 - fatG * 9) / 4, 0);
    const minimumCarbohydrateG =
      input.weightKg * nutritionConfig.postWorkoutMeal.carbohydrateFactors[input.goal].intensity[input.intensity]
      + input.weightKg * nutritionConfig.postWorkoutMeal.carbohydrateFactors[input.goal].duration[input.duration];

    if (carbohydrateG < minimumCarbohydrateG) {
      carbohydrateG = minimumCarbohydrateG;
      const minimumFatG = (finalCalories * nutritionConfig.postWorkoutMeal.minimumFatRatios[input.goal]) / 9;
      const fatThatFitsG = (finalCalories - protein.value * 4 - carbohydrateG * 4) / 9;
      fatG = Math.max(minimumFatG, Math.min(fatG, fatThatFitsG));

      const macroCalories = macroCaloriesFrom({ carbohydrateG, proteinG: protein.value, fatG });
      if (macroCalories > finalCalories) {
        finalCalories = Math.min(calorieConfig.absoluteMaximum, macroCalories);
      }
    }

    const macroResult = finalizeMacroResult({ carbohydrateG, proteinG: protein.value, fatG });
    const baseNutrients = {
      ...nutritionConfig.postWorkoutMeal.nutrientTargets[input.goal],
      bcaaMg: calculateBcaaMg(input.goal, input.weightKg, input.intensity, input.duration),
      arginineMg: calculateArginineMg(input.goal, input.weightKg, input.intensity, input.duration),
    };
    const nutrients = applyNutrientAdjustments(
      baseNutrients,
      ageGroup,
      input.specialNotes.highSatiety ? nutritionConfig.specialConditionAdjustments.postWorkoutHighSatietyFiberG : 0,
      input.weightKg,
      nutritionConfig.postWorkoutMeal.nutrientMultipliers.intensity[input.intensity]
        * nutritionConfig.postWorkoutMeal.nutrientMultipliers.duration[input.duration],
    );

    return {
      calculatorType: "postWorkoutMeal",
      goal: input.goal,
      calories: Math.min(macroResult.calories, calorieConfig.absoluteMaximum),
      macros: {
        carbohydrateG: macroResult.carbohydrateG,
        proteinG: macroResult.proteinG,
        fatG: macroResult.fatG,
        carbohydratePercent: macroResult.ratios.carbohydratePercent,
        proteinPercent: macroResult.ratios.proteinPercent,
        fatPercent: macroResult.ratios.fatPercent,
      },
      nutrients,
      tags: createTags(input, ageGroup),
      description: nutritionConfig.postWorkoutMeal.descriptions[input.goal],
      warning: createAgeWarning(ageGroup),
      meta: createMeta({
        bmr,
        tdee,
        ageGroup,
        ageProteinMultiplier,
        weightRatios,
        rawTargetCalories,
        calorieClampApplied: targetCalories !== rawTargetCalories || finalCalories === calorieConfig.absoluteMaximum,
        rawProteinG: protein.raw,
        proteinClampApplied: protein.clampApplied,
        minimumWorkoutCarbohydrateG: minimumCarbohydrateG,
      }),
    };
  }

  function getAgeGroup(age) {
    if (age < 18) return "under18";
    if (age <= 29) return "age18to29";
    if (age <= 39) return "age30to39";
    if (age <= 49) return "age40to49";
    if (age <= 59) return "age50to59";
    if (age <= 69) return "age60to69";
    return "age70Plus";
  }

  function validateCommonInput(input) {
    const errors = {};
    if (!Number.isFinite(input.age)) {
      errors.age = "나이를 입력해 주세요.";
    } else if (!Number.isInteger(input.age) || input.age <= 0) {
      errors.age = "나이는 0보다 큰 정수로 입력해 주세요.";
    }
    if (!Number.isFinite(input.heightCm)) {
      errors.heightCm = "키를 입력해 주세요.";
    } else if (input.heightCm <= 0) {
      errors.heightCm = "키는 0보다 큰 숫자로 입력해 주세요.";
    }
    if (!Number.isFinite(input.weightKg)) {
      errors.weightKg = "몸무게를 입력해 주세요.";
    } else if (input.weightKg <= 0) {
      errors.weightKg = "몸무게는 0보다 큰 숫자로 입력해 주세요.";
    }
    return errors;
  }

  function calculateBmr(input) {
    const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
    return input.gender === "male" ? base + 5 : base - 161;
  }

  function calculateProteinG({
    weightKg,
    factor,
    minimumG,
    maximumG,
    ageProteinMultiplier,
    highProtein,
  }) {
    const rawProteinG = weightKg * factor * ageProteinMultiplier * (highProtein ? nutritionConfig.specialConditionAdjustments.highProteinMultiplier : 1);
    const proteinG = clamp(rawProteinG, minimumG, maximumG);
    return {
      raw: rawProteinG,
      value: proteinG,
      clampApplied: proteinG !== rawProteinG,
    };
  }

  function applyNutrientAdjustments(baseNutrients, ageGroup, extraFiberG, weightKg, workoutAdjustment = 1) {
    const ageAdjustment = nutritionConfig.ageNutrientAdjustments[ageGroup];
    const weightRatio = calculateWeightRatios(weightKg).micronutrientWeightRatio;
    return roundNutrients({
      ...baseNutrients,
      fiberG: applyMicronutrientWeightAdjustment(baseNutrients.fiberG ?? 0, weightRatio) + ageAdjustment.fiberG + extraFiberG,
      calciumMg: applyMicronutrientWeightAdjustment(baseNutrients.calciumMg ?? 0, weightRatio, workoutAdjustment) + ageAdjustment.calciumMg,
      magnesiumMg: applyMicronutrientWeightAdjustment(baseNutrients.magnesiumMg ?? 0, weightRatio, workoutAdjustment) + ageAdjustment.magnesiumMg,
      potassiumMg: baseNutrients.potassiumMg === undefined ? undefined : applyMicronutrientWeightAdjustment(baseNutrients.potassiumMg, weightRatio, workoutAdjustment),
      sodiumMg: baseNutrients.sodiumMg === undefined ? undefined : applyMicronutrientWeightAdjustment(baseNutrients.sodiumMg, weightRatio, workoutAdjustment),
      vitaminDPercent: (baseNutrients.vitaminDPercent ?? 0) + ageAdjustment.vitaminDPercent,
      vitaminB12Percent: (baseNutrients.vitaminB12Percent ?? 0) + ageAdjustment.vitaminB12Percent,
    });
  }

  function createTags(input, ageGroup) {
    const tags = [];
    const { specialNotes } = input;
    const ageTag = nutritionConfig.ageTags[ageGroup];

    if (input.calculatorType === "postWorkoutMeal") {
      tags.push(nutritionConfig.intakeTimingTags[input.intakeTime]);
      tags.push(nutritionConfig.postWorkoutMeal.tags[input.goal]);
    }
    if (specialNotes.lowSugar) tags.push(...nutritionConfig.tags.lowSugar);
    if (specialNotes.highSatiety) tags.push(...nutritionConfig.tags.highSatiety);
    if (specialNotes.lactoseSensitive) tags.push(...nutritionConfig.tags.lactoseSensitive);
    if (specialNotes.nutFree) tags.push(...nutritionConfig.tags.nutFree);
    if (specialNotes.caffeineFree) tags.push(...nutritionConfig.tags.caffeineFree);
    if (ageTag && ageGroup !== "under18") tags.push(ageTag);
    return tags;
  }

  function createAgeWarning(ageGroup) {
    if (ageGroup === "under18") return nutritionConfig.ageWarnings.under18;
    if (ageGroup === "age70Plus") return nutritionConfig.ageWarnings.age70Plus;
    return undefined;
  }

  function createMeta({
    bmr,
    tdee,
    ageGroup,
    ageProteinMultiplier,
    weightRatios,
    rawTargetCalories,
    calorieClampApplied,
    rawProteinG,
    proteinClampApplied,
    minimumWorkoutCarbohydrateG,
  }) {
    return {
      bmr: roundKcal(bmr),
      tdee: roundKcal(tdee),
      ageGroup,
      ageProteinMultiplier,
      rawWeightRatio: roundMeta(weightRatios.rawWeightRatio),
      energyWeightRatio: roundMeta(weightRatios.energyWeightRatio),
      macroWeightRatio: roundMeta(weightRatios.macroWeightRatio),
      micronutrientWeightRatio: roundMeta(weightRatios.micronutrientWeightRatio),
      rawTargetCalories: roundKcal(rawTargetCalories),
      calorieClampApplied,
      rawProteinG: roundMeta(rawProteinG),
      proteinClampApplied,
      minimumWorkoutCarbohydrateG: minimumWorkoutCarbohydrateG === undefined ? undefined : roundMeta(minimumWorkoutCarbohydrateG),
      calculationBlocked: false,
    };
  }

  function finalizeMacroResult(macros) {
    const roundedMacros = {
      carbohydrateG: Math.max(0, roundGram(macros.carbohydrateG)),
      proteinG: Math.max(0, roundGram(macros.proteinG)),
      fatG: Math.max(0, roundGram(macros.fatG)),
    };
    const calories = roundKcal(macroCaloriesFrom(roundedMacros));
    const ratios = calculateMacroPercents(roundedMacros, calories);
    return {
      calories,
      ...roundedMacros,
      ratios,
    };
  }

  function calculateMacroPercents(macros, calories) {
    const raw = {
      carbohydratePercent: calories > 0 ? (macros.carbohydrateG * 4) / calories * 100 : 0,
      proteinPercent: calories > 0 ? (macros.proteinG * 4) / calories * 100 : 0,
      fatPercent: calories > 0 ? (macros.fatG * 9) / calories * 100 : 0,
    };
    const rounded = {
      carbohydratePercent: Math.round(raw.carbohydratePercent),
      proteinPercent: Math.round(raw.proteinPercent),
      fatPercent: Math.round(raw.fatPercent),
    };
    const diff = 100 - (rounded.carbohydratePercent + rounded.proteinPercent + rounded.fatPercent);
    if (diff !== 0) {
      const largest = Object.entries(raw).sort(([, a], [, b]) => b - a)[0][0];
      rounded[largest] += diff;
    }
    return rounded;
  }

  function roundNutrients(nutrients) {
    return Object.fromEntries(
      Object.entries(nutrients)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => {
          if (typeof value === "number") return [key, Math.max(0, Math.round(value))];
          return [key, value];
        }),
    );
  }

  function calculateWeightRatios(weightKg) {
    const { referenceWeightKg, energyRatio, macroRatio, micronutrientRatio } = nutritionConfig.weightAdjustment;
    const rawWeightRatio = weightKg / referenceWeightKg;
    return {
      rawWeightRatio,
      energyWeightRatio: clamp(rawWeightRatio, energyRatio.minimum, energyRatio.maximum),
      macroWeightRatio: clamp(rawWeightRatio, macroRatio.minimum, macroRatio.maximum),
      micronutrientWeightRatio: clamp(rawWeightRatio, micronutrientRatio.minimum, micronutrientRatio.maximum),
    };
  }

  function applyMicronutrientWeightAdjustment(baseValue, micronutrientWeightRatio, workoutAdjustment = 1) {
    return baseValue * micronutrientWeightRatio * workoutAdjustment;
  }

  function calculateBcaaMg(goal, weightKg, intensity, duration) {
    const bcaa = nutritionConfig.postWorkoutMeal.functionalIngredients.bcaa[goal];
    let bcaaG = weightKg < bcaa.lowWeightThresholdKg ? bcaa.lowG : weightKg < bcaa.highWeightThresholdKg ? bcaa.mediumG : bcaa.highG;
    if (intensity === "intense" || duration === "over75") {
      bcaaG += bcaa.intenseOrLongAddG;
    }
    return clamp(bcaaG, bcaa.minimumG, bcaa.maximumG) * 1000;
  }

  function calculateArginineMg(goal, weightKg, intensity, duration) {
    const arginine = nutritionConfig.postWorkoutMeal.functionalIngredients.arginine[goal];
    let arginineMg = weightKg < arginine.lowWeightThresholdKg ? arginine.lowMg : weightKg < arginine.highWeightThresholdKg ? arginine.mediumMg : arginine.highMg;
    if (intensity === "intense" || duration === "over75") {
      arginineMg += arginine.intenseOrLongAddMg;
    }
    return clamp(arginineMg, arginine.minimumMg, arginine.maximumMg);
  }

  function macroCaloriesFrom(macros) {
    return macros.carbohydrateG * 4 + macros.proteinG * 4 + macros.fatG * 9;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function roundGram(value) {
    return Math.round(value);
  }

  function roundKcal(value) {
    return Math.round(value);
  }

  function roundMeta(value) {
    return Math.round(value * 100) / 100;
  }

  window.Verden = window.Verden || {};
  window.Verden.nutritionEngine = {
    calculateNutrition,
    calculateNutritionForFunnel,
    defaults: DEFAULTS,
    getAgeGroup,
  };
})();
