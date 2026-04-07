/**
 * GPA Suggestion Calculator
 * Generates smart course/grade combinations to achieve target GPA
 */

const GRADE_POINTS = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  E: 0.0,
};

const GRADE_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "E"];
const HIGH_GRADES = new Set(["A+", "A", "A-", "B+", "B"]);
const MINIMUM_GRADE_PATH = ["C", "C+", "B-", "B", "B+", "A-", "A"];

const round2 = (value) => Number((value || 0).toFixed(2));

const compareMeetingCandidate = (a, b) => {
  if (!b) return true;
  if (a.aCount !== b.aCount) return a.aCount < b.aCount;
  if (a.bCount !== b.bCount) return a.bCount < b.bCount;
  if (a.overshoot !== b.overshoot) return a.overshoot < b.overshoot;
  return a.totalHighGrades < b.totalHighGrades;
};

const compareFallbackCandidate = (a, b) => {
  if (!b) return true;
  if (a.points !== b.points) return a.points > b.points;
  if (a.aCount !== b.aCount) return a.aCount < b.aCount;
  if (a.bCount !== b.bCount) return a.bCount < b.bCount;
  return a.totalHighGrades < b.totalHighGrades;
};

const sortMeetingCandidates = (a, b) => {
  if (a.aCount !== b.aCount) return a.aCount - b.aCount;
  if (a.bCount !== b.bCount) return a.bCount - b.bCount;
  if (a.overshoot !== b.overshoot) return a.overshoot - b.overshoot;
  if (a.totalHighGrades !== b.totalHighGrades) return a.totalHighGrades - b.totalHighGrades;
  return a.key.localeCompare(b.key);
};

const sortFallbackCandidates = (a, b) => {
  if (a.points !== b.points) return b.points - a.points;
  if (a.aCount !== b.aCount) return a.aCount - b.aCount;
  if (a.bCount !== b.bCount) return a.bCount - b.bCount;
  if (a.totalHighGrades !== b.totalHighGrades) return a.totalHighGrades - b.totalHighGrades;
  return a.key.localeCompare(b.key);
};

const buildScenarioFromSubjectPlan = ({
  courses,
  grades,
  requiredGPA,
  requiredPoints,
  points,
  meetsTarget,
}) => {
  const totalCredits = courses.reduce((sum, course) => sum + Number(course.creditHours || 0), 0);
  const gradeDistribution = {};

  const subjectGrades = courses.map((course, index) => {
    const grade = grades[index];
    const creditHours = Number(course.creditHours || 0);
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    return {
      subjectCode: course.subjectCode,
      subjectName: course.subjectName,
      creditHours,
      recommendedGrade: grade,
      gradePoints: GRADE_POINTS[grade],
      weightedPoints: round2(creditHours * GRADE_POINTS[grade]),
    };
  });

  const num3Credit = courses.filter((course) => Number(course.creditHours) === 3).length;
  const num2Credit = courses.filter((course) => Number(course.creditHours) === 2).length;
  const totalHighGrades = subjectGrades.filter((subject) => HIGH_GRADES.has(subject.recommendedGrade)).length;

  return {
    num3Credit,
    num2Credit,
    totalCredits,
    requiredGPA: round2(requiredGPA),
    totalPointsNeeded: round2(requiredPoints),
    achievedPoints: round2(points),
    achievedSemesterGPA: totalCredits > 0 ? round2(points / totalCredits) : 0,
    gradeDistribution,
    subjectGrades,
    effort: totalHighGrades,
    achievable: meetsTarget,
    shortfall: round2(Math.max(0, requiredGPA - (totalCredits > 0 ? points / totalCredits : 0))),
  };
};

const findBestGradesForSubjects = (courses, requiredGPA, limit = 3) => {
  const normalizedCourses = (courses || [])
    .map((course) => ({
      subjectCode: String(course.subjectCode || "").trim(),
      subjectName: String(course.subjectName || course.subjectCode || "").trim(),
      creditHours: Number(course.creditHours || 0),
    }))
    .filter((course) => course.subjectCode && course.creditHours > 0);

  const totalCredits = normalizedCourses.reduce((sum, course) => sum + course.creditHours, 0);
  if (totalCredits <= 0) return { scenarios: [], isAchievable: false };

  const requiredPoints = requiredGPA * totalCredits;

  const meetingCandidates = [];
  const fallbackCandidates = [];
  const grades = Array(normalizedCourses.length).fill(MINIMUM_GRADE_PATH[0]);

  const walk = (index, runningPoints, aCount, bCount) => {
    if (index === normalizedCourses.length) {
      const totalHighGrades = aCount + bCount;
      const candidate = {
        points: runningPoints,
        grades: [...grades],
        aCount,
        bCount,
        totalHighGrades,
        overshoot: round2(Math.max(0, runningPoints - requiredPoints)),
        key: grades.join("|"),
      };

      if (runningPoints >= requiredPoints) {
        meetingCandidates.push(candidate);
      } else {
        fallbackCandidates.push(candidate);
      }
      return;
    }

    const course = normalizedCourses[index];

    MINIMUM_GRADE_PATH.forEach((grade) => {
      grades[index] = grade;
      const nextPoints = runningPoints + GRADE_POINTS[grade] * course.creditHours;
      walk(
        index + 1,
        nextPoints,
        aCount + (grade === "A" ? 1 : 0),
        bCount + (grade === "B" ? 1 : 0)
      );
    });
  };

  walk(0, 0, 0, 0);

  const uniqueByKey = (candidates) => {
    const seen = new Set();
    return candidates.filter((candidate) => {
      if (seen.has(candidate.key)) return false;
      seen.add(candidate.key);
      return true;
    });
  };

  if (meetingCandidates.length > 0) {
    const top = uniqueByKey(meetingCandidates.sort(sortMeetingCandidates)).slice(0, limit);
    return {
      isAchievable: true,
      scenarios: top.map((candidate) =>
        buildScenarioFromSubjectPlan({
          courses: normalizedCourses,
          grades: candidate.grades,
          requiredGPA,
          requiredPoints,
          points: candidate.points,
          meetsTarget: true,
        })
      ),
    };
  }

  const fallbackTop = uniqueByKey(fallbackCandidates.sort(sortFallbackCandidates)).slice(0, limit);
  return {
    isAchievable: false,
    scenarios: fallbackTop.map((candidate) =>
      buildScenarioFromSubjectPlan({
        courses: normalizedCourses,
        grades: candidate.grades,
        requiredGPA,
        requiredPoints,
        points: candidate.points,
        meetsTarget: false,
      })
    ),
  };
};

/**
 * Generate all valid combinations of 3-credit and 2-credit courses
 * that sum close to the targetCredits (within ±1 credit)
 */
const generateCourseConfigurations = (targetCredits) => {
  const configurations = [];
  
  // For each possible number of 3-credit courses
  for (let num3Credit = 0; num3Credit <= Math.ceil(targetCredits / 3); num3Credit++) {
    const creditsFrom3 = num3Credit * 3;
    
    if (creditsFrom3 > targetCredits + 1) break; // Too many credits
    
    // Calculate how many 2-credit courses needed
    const remainingCredits = targetCredits - creditsFrom3;
    
    if (remainingCredits >= 0 && remainingCredits % 2 === 0) {
      const num2Credit = remainingCredits / 2;
      const totalCredits = creditsFrom3 + num2Credit * 2;
      
      // Only add if it exactly matches or is 1 credit off (allow realistic scenarios)
      if (Math.abs(totalCredits - targetCredits) <= 1) {
        configurations.push({
          num3Credit,
          num2Credit,
          totalCredits,
        });
      }
    }
  }
  
  return configurations.length > 0
    ? configurations
    : [{ num3Credit: Math.round(targetCredits / 3), num2Credit: 0, totalCredits: Math.round(targetCredits / 3) * 3 }];
};

/**
 * Find minimum grade combination needed to achieve required GPA for a course configuration
 * Returns a scenario with suggested grades arranged from highest to lowest effort
 */
const findGradeCombo = (num3Credit, num2Credit, requiredGPA) => {
  const totalCredits = num3Credit * 3 + num2Credit * 2;
  const totalPointsNeeded = round2(requiredGPA * totalCredits);
  const totalPointsNeededScaled = Math.ceil(totalPointsNeeded * 10);
  const maxPointsScaled = Math.round(totalCredits * 4 * 10);
  
  // Create an array of all courses: 3-credit and 2-credit
  const courses = [
    ...Array(num3Credit).fill(3),
    ...Array(num2Credit).fill(2),
  ];
  
  // Try to build a scenario: maximize high grades for 3-credit, then adjust remainder
  const scenario = {
    num3Credit,
    num2Credit,
    totalCredits,
    requiredGPA: round2(requiredGPA),
    totalPointsNeeded: round2(totalPointsNeeded),
    gradeDistribution: {},
    achievable: false,
    effort: 0, // Lower = easier (fewer high grades needed)
    achievedPoints: 0,
    achievedSemesterGPA: 0,
  };

  // Dynamic programming over possible point totals.
  // Keep the lowest effort path for each points bucket.
  let states = new Map();
  states.set(0, { effort: 0, grades: [] });

  courses.forEach((courseCredits) => {
    const nextStates = new Map();

    states.forEach((state, pointsScaled) => {
      GRADE_ORDER.forEach((grade) => {
        const addedPointsScaled = Math.round(GRADE_POINTS[grade] * courseCredits * 10);
        const nextPoints = pointsScaled + addedPointsScaled;
        const boundedPoints = Math.min(nextPoints, maxPointsScaled);
        const nextEffort = state.effort + (HIGH_GRADES.has(grade) ? 1 : 0);
        const existing = nextStates.get(boundedPoints);
        const nextGradePlan = [...state.grades, grade];

        if (!existing || nextEffort < existing.effort) {
          nextStates.set(boundedPoints, { effort: nextEffort, grades: nextGradePlan });
        }
      });
    });

    states = nextStates;
  });

  // Pick the easiest plan that meets/exceeds required points.
  // If none meet target, pick the closest under target.
  let bestMatch = null;
  states.forEach((state, pointsScaled) => {
    if (pointsScaled >= totalPointsNeededScaled) {
      if (
        !bestMatch ||
        state.effort < bestMatch.effort ||
        (state.effort === bestMatch.effort && pointsScaled < bestMatch.pointsScaled)
      ) {
        bestMatch = { ...state, pointsScaled };
      }
    }
  });

  let closestBelow = null;
  states.forEach((state, pointsScaled) => {
    if (pointsScaled < totalPointsNeededScaled) {
      if (
        !closestBelow ||
        pointsScaled > closestBelow.pointsScaled ||
        (pointsScaled === closestBelow.pointsScaled && state.effort < closestBelow.effort)
      ) {
        closestBelow = { ...state, pointsScaled };
      }
    }
  });

  const chosen = bestMatch || closestBelow;
  if (chosen) {
    const distribution = {};
    chosen.grades.forEach((grade) => {
      distribution[grade] = (distribution[grade] || 0) + 1;
    });

    scenario.gradeDistribution = distribution;
    scenario.effort = chosen.effort;
    scenario.achievedPoints = round2(chosen.pointsScaled / 10);
    scenario.achievedSemesterGPA = round2(scenario.achievedPoints / totalCredits);
    scenario.achievable = Boolean(bestMatch);
  }
  
  return scenario;
};

/**
 * Generate smart GPA suggestions based on current progress and target
 * @param {number} currentGPA - Current cumulative GPA
 * @param {number} currentCredits - Total credits completed
 * @param {number} targetGPA - Desired cumulative GPA
 * @param {number} plannedCredits - Credits planned for next semester
 * @returns {Object} Object containing suggestions and metadata
 */
export const generateGPASuggestions = ({
  currentGPA,
  currentCredits,
  targetGPA,
  plannedCredits,
  nextSemesterCourses,
}) => {
  const result = {
    isAchievable: false,
    requiredSemesterGPA: 0,
    scenarios: [],
    bestScenario: null,
    isClosestFallback: false,
    message: "",
  };
  
  const usingCoursePlan = Array.isArray(nextSemesterCourses) && nextSemesterCourses.length > 0;

  // Validate inputs
  if (Number.isNaN(targetGPA)) {
    result.message = "Please enter a valid target GPA.";
    return result;
  }
  
  const currentGPAVal = Number(currentGPA || 0);
  const currentCreditsVal = Number(currentCredits || 0);
  const targetGPAVal = Number(targetGPA);
  const plannedCreditsVal = usingCoursePlan
    ? nextSemesterCourses.reduce((sum, course) => sum + Number(course.creditHours || 0), 0)
    : Number(plannedCredits);

  if (Number.isNaN(plannedCreditsVal) || plannedCreditsVal <= 0) {
    result.message = usingCoursePlan
      ? "No valid courses were found for the next semester."
      : "Please enter valid target GPA and planned credits.";
    return result;
  }
  
  // Calculate required semester GPA using cumulative GPA formula
  const requiredSemesterGPA = (targetGPAVal * (currentCreditsVal + plannedCreditsVal) - 
                               currentGPAVal * currentCreditsVal) / plannedCreditsVal;
  
  result.requiredSemesterGPA = round2(requiredSemesterGPA);

  if (requiredSemesterGPA < 0) {
    result.message = "Target already achieved! Your current GPA already exceeds the target.";
    return result;
  }

  if (usingCoursePlan) {
    const ranked = findBestGradesForSubjects(nextSemesterCourses, requiredSemesterGPA, 1);

    if (!ranked.scenarios.length) {
      result.message = "Unable to build grade recommendations for the selected semester courses.";
      return result;
    }

    result.scenarios = ranked.scenarios;
    result.bestScenario = ranked.scenarios[0];
    result.isAchievable = ranked.isAchievable;
    result.isClosestFallback = !ranked.isAchievable;

    if (ranked.isAchievable) {
      result.message = `Minimum required grades (starting from C -> C+ -> B- -> B -> B+ -> A- -> A) found for your next semester courses. Required semester GPA: ${round2(requiredSemesterGPA).toFixed(2)}.`;
    } else if (requiredSemesterGPA > 4.0) {
      result.message = `Not achievable: You need a semester GPA of ${round2(requiredSemesterGPA).toFixed(2)}, which exceeds the maximum of 4.0. Showing the closest ${ranked.scenarios.length} plans with your next semester courses.`;
    } else {
      result.message = `Exact target cannot be reached with C-to-A limits for these courses. Showing the closest ${ranked.scenarios.length} plans.`;
    }

    return result;
  }

  const configurations = generateCourseConfigurations(plannedCreditsVal);
  
  // Check if achievable
  if (requiredSemesterGPA > 4.0) {
    const fallbackScenarios = configurations
      .map((config) => {
        const maxScenario = findGradeCombo(config.num3Credit, config.num2Credit, 4.0);
        return {
          ...maxScenario,
          shortfall: round2(result.requiredSemesterGPA - maxScenario.achievedSemesterGPA),
        };
      })
      .sort((a, b) => {
        if (a.shortfall !== b.shortfall) {
          return a.shortfall - b.shortfall;
        }
        return a.effort - b.effort;
      });

    result.scenarios = fallbackScenarios.slice(0, 4);
    result.bestScenario = result.scenarios[0] || null;
    result.isClosestFallback = result.scenarios.length > 0;
    result.message = `Not achievable: You need a semester GPA of ${round2(requiredSemesterGPA).toFixed(2)}, which exceeds the maximum of 4.0. Showing the closest possible scenarios.`;
    return result;
  }
  
  result.isAchievable = true;
  
  // Generate configurations and scenarios
  
  configurations.forEach((config) => {
    const scenario = findGradeCombo(config.num3Credit, config.num2Credit, requiredSemesterGPA);
    if (scenario.achievable) {
      result.scenarios.push(scenario);
    }
  });
  
  // Sort scenarios by effort (ascending) - easier scenarios first
  result.scenarios.sort((a, b) => {
    if (a.effort !== b.effort) {
      return a.effort - b.effort;
    }
    // If effort is the same, prefer scenarios with more courses (more flexibility)
    return a.totalCredits - b.totalCredits;
  });
  
  if (result.scenarios.length === 0) {
    const closestScenarios = configurations
      .map((config) => findGradeCombo(config.num3Credit, config.num2Credit, requiredSemesterGPA))
      .filter((scenario) => scenario.totalCredits > 0)
      .map((scenario) => ({
        ...scenario,
        shortfall: round2(result.requiredSemesterGPA - scenario.achievedSemesterGPA),
      }))
      .sort((a, b) => {
        if (a.shortfall !== b.shortfall) {
          return a.shortfall - b.shortfall;
        }
        return a.effort - b.effort;
      });

    result.scenarios = closestScenarios.slice(0, 4);
    result.bestScenario = result.scenarios[0] || null;
    result.isClosestFallback = result.scenarios.length > 0;
    result.message = "Exact target-matching scenarios were not found. Showing the closest available scenarios.";
    result.isAchievable = false;
    return result;
  }
  
  result.bestScenario = result.scenarios[0];
  result.message = `You need an average semester GPA of ${round2(requiredSemesterGPA).toFixed(2)}.`;
  
  return result;
};

/**
 * Format a grade distribution for display
 * @param {Object} distribution - Grade distribution object
 * @returns {string} Human-readable format
 */
export const formatGradeDistribution = (distribution) => {
  if (!distribution || Object.keys(distribution).length === 0) {
    return "No grades assigned";
  }
  
  const parts = [];
  GRADE_ORDER.forEach((grade) => {
    if (distribution[grade] && distribution[grade] > 0) {
      parts.push(`${distribution[grade]}x ${grade}`);
    }
  });
  
  return parts.join(", ");
};

/**
 * Format a scenario for display
 * @param {Object} scenario - Scenario object
 * @returns {string} Human-readable scenario description
 */
export const formatScenarioDescription = (scenario) => {
  const creditDescriptions = [];
  
  if (scenario.num3Credit > 0) {
    creditDescriptions.push(`${scenario.num3Credit} × 3-credit course${scenario.num3Credit > 1 ? "s" : ""}`);
  }
  
  if (scenario.num2Credit > 0) {
    creditDescriptions.push(`${scenario.num2Credit} × 2-credit course${scenario.num2Credit > 1 ? "s" : ""}`);
  }
  
  const courseDescription = creditDescriptions.join(" + ");
  const gradeDescription = formatGradeDistribution(scenario.gradeDistribution);
  
  return `${courseDescription}: ${gradeDescription}`;
};

/**
 * Get effort level label
 * @param {number} effort - Effort score (number of high grades needed)
 * @param {number} totalCourses - Total number of courses
 * @returns {string} Effort level label
 */
export const getEffortLabel = (effort, totalCourses) => {
  if (totalCourses === 0) return "Unknown";
  
  const percentage = (effort / totalCourses) * 100;
  
  if (percentage === 0) return "Very Easy";
  if (percentage <= 25) return "Easy";
  if (percentage <= 50) return "Moderate";
  if (percentage <= 75) return "Challenging";
  return "Very Challenging";
};
