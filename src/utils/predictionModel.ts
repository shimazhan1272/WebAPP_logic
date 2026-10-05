import {
  BoatData,
  FormationGroup,
  ModelSliders,
  PredictionResult,
  TicketPrediction,
  WeatherData,
} from '../types/boatrace';

// ==========================================
// 7-1. CONFIG Constants (Estimated from 264,035 races)
// ==========================================
export const CONFIG = {
  // コース別の切片（1着用。1コース=0基準）
  COURSE_INTERCEPT: [0.0, -1.401, -1.5192, -1.6912, -2.2128, -3.0918],

  // 艇ごとの成績項（基準値。cL2/cM2 はスライダーで調整）
  cWin: 0.6347,
  cN2: -0.0124,
  cL2: 0.0035,
  cM2: 0.01,

  // コース別（1〜6コース）の係数
  ST_COEF: [5.186, 1.208, 1.807, 2.795, 2.968, 4.099], // スタート（平均ST）
  EX_COEF: [2.768, 3.831, 4.071, 4.949, 4.408, 4.602], // 展示タイム（基準値。スライダーで調整）

  // 級別補正
  GRADE_ADJ: {
    A1: 0.217,
    A2: 0.1065,
    B1: 0.0,
    B2: -0.1727,
  } as Record<string, number>,

  FRONT_ENTRY_PENALTY: -0.136, // 枠番より内側に動いた艇に、動いたコース数×この値を加算

  // 風（コース別・各6要素）
  WIND_LIN: [-0.0266, -0.0051, 0.0066, 0.0027, 0.0061, 0.0162],
  WIND_OVER5: [-0.0191, 0.0193, -0.0204, 0.0101, -0.0047, 0.0148],
  WIND_TAIL: [0.0066, 0.0266, 0.006, -0.0021, -0.0187, -0.0184],
  WIND_CROSS: [0.0202, 0.0062, 0.0057, -0.0015, -0.0072, -0.0234],
  WIND_TAIL_OVER5: [0.0025, -0.0178, -0.026, -0.0014, 0.0366, 0.0061],
  WIND_CROSS_OVER5: [-0.0327, -0.0178, -0.0285, -0.0046, 0.016, 0.0676],

  // 着順別の温度とコース補正
  LAMBDA: [1.0, 0.7755, 0.7003],
  COURSE_OFFSET2: [-0.4445, 0.1855, 0.0972, -0.0266, 0.0471, 0.1414],
  COURSE_OFFSET3: [-0.8935, -0.0251, 0.0348, 0.0797, 0.2321, 0.5721],
};

// ==========================================
// 7-3. Wind Term Calculation
// ==========================================
export function calculateWindTerms(
  windSpeed: number,
  windDirCode: number | null
): number[] {
  const w = windSpeed;
  if (!windDirCode || windDirCode >= 17 || w <= 0) {
    return [0, 0, 0, 0, 0, 0];
  }

  const rad = ((windDirCode - 5) * Math.PI) / 8;
  const tau = Math.cos(rad);
  const sigma = Math.sin(rad);
  const h = Math.max(0, w - 5);

  const windTerms = new Array(6);
  for (let c = 0; c < 6; c++) {
    windTerms[c] =
      CONFIG.WIND_LIN[c] * w +
      CONFIG.WIND_OVER5[c] * h +
      CONFIG.WIND_TAIL[c] * w * tau +
      CONFIG.WIND_CROSS[c] * w * sigma +
      CONFIG.WIND_TAIL_OVER5[c] * h * tau +
      CONFIG.WIND_CROSS_OVER5[c] * h * sigma;
  }
  return windTerms;
}

// Wind direction text generator (追い風/向かい風/横風)
export function getWindDirectionDescription(
  windDirCode: number | null,
  windSpeed: number
): string {
  if (!windDirCode || windDirCode >= 17 || windSpeed <= 0) {
    return '無風';
  }
  if (windDirCode >= 4 && windDirCode <= 6) return '追い風';
  if (windDirCode >= 12 && windDirCode <= 14) return '向かい風';
  if (windDirCode >= 7 && windDirCode <= 11) return '右横風';
  return '左横風';
}

// ==========================================
// 7-2 & 7-4. Prediction Logic (Pure Function)
// ==========================================
export function predict(
  boats: BoatData[],
  courses: number[], // Length 6, courses for boat 1 to 6 (values 1 to 6)
  weather: WeatherData,
  sliders: ModelSliders,
  nTrifecta: number,
  nExacta: number,
  nTrio: number
): PredictionResult {
  // Validate and normalize courses (1-indexed to 0-indexed)
  let courseIndices = courses.map((c) => c - 1);
  const uniqueCourses = new Set(courseIndices);
  let entryWarning: string | undefined;

  if (courseIndices.length !== 6 || uniqueCourses.size !== 6 || courseIndices.some((c) => c < 0 || c > 5)) {
    entryWarning = '進入コースに重複または欠落があるため、枠なり進入（1〜6）として計算します。';
    courseIndices = [0, 1, 2, 3, 4, 5];
  }

  // Check if standard frame entry (枠なり)
  const entryIsStandard = courseIndices.every((c, i) => c === i);

  // Form entry sequence text (e.g. 4-1-2-3-5-6)
  // Find which boat is at each course 0..5
  const boatAtCourse = new Array<number>(6);
  courseIndices.forEach((c, bIndex) => {
    boatAtCourse[c] = bIndex + 1;
  });
  const entryFormationText = boatAtCourse.join('-');

  // Sliders adjustment
  // cL2' = cL2 * (1 + slider / 3)
  const cL2Prime = CONFIG.cL2 * (1 + sliders.localTop2 / 3);
  const cM2Prime = CONFIG.cM2 * (1 + sliders.motorTop2 / 3);
  const exCoefPrime = CONFIG.EX_COEF.map((v) => v * (1 + sliders.exhibition / 3));

  // Wind terms
  const windTerms = calculateWindTerms(weather.windSpeed, weather.windDirCode);

  // Wind course effects (コース平均からの差)
  const windMean = windTerms.reduce((sum, val) => sum + val, 0) / 6;
  const windCourseEffects = windTerms.map((w, idx) => ({
    course: idx + 1,
    delta: Number((w - windMean).toFixed(2)),
  }));

  // Wind summary text
  let windSummaryText = '風補正なし';
  if (weather.windSpeed > 0 && weather.windDirCode && weather.windDirCode < 17) {
    const dirDesc = getWindDirectionDescription(weather.windDirCode, weather.windSpeed);
    const effectsText = windCourseEffects
      .map((e) => `${e.course}コース${e.delta >= 0 ? '+' : ''}${e.delta.toFixed(2)}`)
      .join('・');
    windSummaryText = `風速${weather.windSpeed}m・${dirDesc}: ${effectsText}`;
  }

  // Exhibition time checking
  // "展示タイムが0以下または全艇分そろわない場合、展示項は全艇0"
  const allExValid =
    boats.length === 6 &&
    boats.every((b) => b.exhibitionTime !== null && b.exhibitionTime !== undefined && b.exhibitionTime > 0);

  const avgEx = allExValid
    ? boats.reduce((sum, b) => sum + (b.exhibitionTime || 0), 0) / 6
    : 0;

  // Calculate scores for each boat
  const scores: number[] = new Array(6);
  for (let i = 0; i < 6; i++) {
    const b = boats[i];
    const c = courseIndices[i]; // Course of boat i (0 to 5)
    const boatNumber = i + 1; // 1 to 6

    const winRate = b.nationalWinRate ?? 5.5;
    const n2 = b.nationalTop2Percent ?? 35.0;
    const l2 = b.localTop2Percent ?? 35.0;
    const m2 = b.motorTop2Percent ?? 35.0;
    const st = b.averageStartTiming && b.averageStartTiming > 0 ? b.averageStartTiming : 0.16;
    const gradeAdj = CONFIG.GRADE_ADJ[b.racerClass] ?? 0.0;

    let exTerm = 0;
    if (allExValid && b.exhibitionTime) {
      exTerm = -exCoefPrime[c] * (b.exhibitionTime - avgEx);
    }

    const frontPenalty = CONFIG.FRONT_ENTRY_PENALTY * Math.max(0, (boatNumber - 1) - c);

    scores[i] =
      CONFIG.COURSE_INTERCEPT[c] +
      CONFIG.cWin * (winRate - 5.5) +
      CONFIG.cN2 * (n2 - 35.0) +
      cL2Prime * (l2 - 35.0) +
      cM2Prime * (m2 - 35.0) -
      CONFIG.ST_COEF[c] * (st - 0.16) +
      gradeAdj +
      exTerm +
      windTerms[c] +
      frontPenalty;
  }

  // 7-4. Probabilities & Ticket Selections
  const maxScore = Math.max(...scores);
  const e1 = scores.map((s) => Math.exp(s - maxScore));
  const sumE1 = e1.reduce((acc, v) => acc + v, 0);
  const firstPlaceProbabilities = e1.map((v) => v / sumE1);

  const e2 = scores.map((s, i) =>
    Math.exp(CONFIG.LAMBDA[1] * (s - maxScore) + CONFIG.COURSE_OFFSET2[courseIndices[i]])
  );
  const sumE2 = e2.reduce((acc, v) => acc + v, 0);

  const e3 = scores.map((s, i) =>
    Math.exp(CONFIG.LAMBDA[2] * (s - maxScore) + CONFIG.COURSE_OFFSET3[courseIndices[i]])
  );

  // Calculate all 120 3連単 probabilities
  const trifectaList: TicketPrediction[] = [];
  for (let a = 0; a < 6; a++) {
    const pA = e1[a] / sumE1;
    const remE2 = sumE2 - e2[a];
    for (let b = 0; b < 6; b++) {
      if (b === a) continue;
      const pB = e2[b] / remE2;
      let remE3 = 0;
      for (let c = 0; c < 6; c++) {
        if (c !== a && c !== b) remE3 += e3[c];
      }
      for (let c = 0; c < 6; c++) {
        if (c === a || c === b) continue;
        const pC = e3[c] / remE3;
        const prob = pA * pB * pC;
        trifectaList.push({
          combination: [a + 1, b + 1, c + 1],
          label: `${a + 1}-${b + 1}-${c + 1}`,
          probability: prob,
        });
      }
    }
  }

  // Sort descending by probability
  trifectaList.sort((x, y) => y.probability - x.probability);
  const selectedTrifecta = trifectaList.slice(0, Math.min(nTrifecta, trifectaList.length));

  // Calculate all 30 2連単 probabilities
  const exactaList: TicketPrediction[] = [];
  for (let a = 0; a < 6; a++) {
    const pA = e1[a] / sumE1;
    const remE2 = sumE2 - e2[a];
    for (let b = 0; b < 6; b++) {
      if (b === a) continue;
      const pB = e2[b] / remE2;
      exactaList.push({
        combination: [a + 1, b + 1],
        label: `${a + 1}-${b + 1}`,
        probability: pA * pB,
      });
    }
  }
  exactaList.sort((x, y) => y.probability - x.probability);
  const selectedExacta = exactaList.slice(0, Math.min(nExacta, exactaList.length));

  // Calculate all 20 3連複 probabilities
  // Trio is unordered combination of 3 boats. Sum of all 6 permutations.
  const trioMap = new Map<string, { combination: number[]; prob: number }>();
  for (const t of trifectaList) {
    const sorted = [...t.combination].sort((x, y) => x - y);
    const key = sorted.join('=');
    const existing = trioMap.get(key);
    if (existing) {
      existing.prob += t.probability;
    } else {
      trioMap.set(key, { combination: sorted, prob: t.probability });
    }
  }
  const trioList: TicketPrediction[] = Array.from(trioMap.values()).map((item) => ({
    combination: item.combination,
    label: item.combination.join('='),
    probability: item.prob,
  }));
  trioList.sort((x, y) => y.probability - x.probability);
  const selectedTrio = trioList.slice(0, Math.min(nTrio, trioList.length));

  // Build formation groups
  const trifectaFormations = aggregateTrifectaFormations(selectedTrifecta);
  const exactaFormations = aggregateExactaFormations(selectedExacta);
  const trioFormations = aggregateTrioFormations(selectedTrio);

  return {
    firstPlaceProbabilities,
    trifecta: {
      formations: trifectaFormations,
      allTickets: selectedTrifecta,
      totalCount: selectedTrifecta.length,
    },
    exacta: {
      formations: exactaFormations,
      allTickets: selectedExacta,
      totalCount: selectedExacta.length,
    },
    trio: {
      formations: trioFormations,
      allTickets: selectedTrio,
      totalCount: selectedTrio.length,
    },
    windCourseEffects,
    windSummaryText,
    entryIsStandard,
    entryFormationText,
    entryWarning,
  };
}

// ==========================================
// Formation Aggregators
// ==========================================

/**
 * Aggregates 3連単 tickets into formation lines.
 * Strictly preserves the exact set of selected tickets without any unselected tickets.
 * Formats: "1-2-345", "1-245-2", "2-34-356", etc. (no commas).
 */
export function aggregateTrifectaFormations(
  tickets: TicketPrediction[]
): FormationGroup[] {
  if (tickets.length === 0) return [];

  // Map of ticket key "a-b-c" to TicketPrediction
  const ticketMap = new Map<string, TicketPrediction>();
  tickets.forEach((t) => ticketMap.set(t.label, t));
  const remainingKeys = new Set(ticketMap.keys());

  const formations: FormationGroup[] = [];

  // Strategy 1: Look for common (1st, 2nd) -> 3rd set (e.g. 1-2-345)
  // Strategy 2: Look for common (1st, 3rd) -> 2nd set (e.g. 1-245-3)
  // Strategy 3: Look for common 1st -> (2nd, 3rd) combinations (e.g. 1-23-234)

  // 1. First find groups sharing same 1st and 2nd
  // Key: "a-b" -> array of c
  const abMap = new Map<string, number[]>();
  for (const key of remainingKeys) {
    const [a, b, c] = key.split('-').map(Number);
    const ab = `${a}-${b}`;
    if (!abMap.has(ab)) abMap.set(ab, []);
    abMap.get(ab)!.push(c);
  }

  // Sort by count descending so larger formations are created first
  const abEntries = Array.from(abMap.entries()).sort(
    (x, y) => y[1].length - x[1].length
  );

  for (const [ab, cList] of abEntries) {
    if (cList.length >= 2) {
      cList.sort((x, y) => x - y);
      const groupTickets: TicketPrediction[] = [];
      let canForm = true;
      for (const c of cList) {
        const k = `${ab}-${c}`;
        if (!remainingKeys.has(k)) {
          canForm = false;
          break;
        }
      }
      if (canForm) {
        for (const c of cList) {
          const k = `${ab}-${c}`;
          groupTickets.push(ticketMap.get(k)!);
          remainingKeys.delete(k);
        }
        const formationText = `${ab}-${cList.join('')}`;
        const totalProbability = groupTickets.reduce(
          (sum, t) => sum + t.probability,
          0
        );
        formations.push({
          formationText,
          tickets: groupTickets,
          ticketCount: groupTickets.length,
          totalProbability,
        });
      }
    }
  }

  // 2. Next check for common (1st, 3rd) sharing: a-X-c
  const acMap = new Map<string, number[]>();
  for (const key of remainingKeys) {
    const [a, b, c] = key.split('-').map(Number);
    const ac = `${a}-*-${c}`;
    if (!acMap.has(ac)) acMap.set(ac, []);
    acMap.get(ac)!.push(b);
  }

  const acEntries = Array.from(acMap.entries()).sort(
    (x, y) => y[1].length - x[1].length
  );
  for (const [ac, bList] of acEntries) {
    if (bList.length >= 2) {
      const [aStr, , cStr] = ac.split('-');
      const a = Number(aStr);
      const c = Number(cStr);
      bList.sort((x, y) => x - y);
      const groupTickets: TicketPrediction[] = [];
      let canForm = true;
      for (const b of bList) {
        const k = `${a}-${b}-${c}`;
        if (!remainingKeys.has(k)) {
          canForm = false;
          break;
        }
      }
      if (canForm) {
        for (const b of bList) {
          const k = `${a}-${b}-${c}`;
          groupTickets.push(ticketMap.get(k)!);
          remainingKeys.delete(k);
        }
        const formationText = `${a}-${bList.join('')}-${c}`;
        const totalProbability = groupTickets.reduce(
          (sum, t) => sum + t.probability,
          0
        );
        formations.push({
          formationText,
          tickets: groupTickets,
          ticketCount: groupTickets.length,
          totalProbability,
        });
      }
    }
  }

  // 3. For any remaining tickets, emit them as individual single-ticket formations
  for (const key of remainingKeys) {
    const t = ticketMap.get(key)!;
    formations.push({
      formationText: t.label,
      tickets: [t],
      ticketCount: 1,
      totalProbability: t.probability,
    });
  }

  // Sort formations by total probability descending
  formations.sort((x, y) => y.totalProbability - x.totalProbability);
  return formations;
}

/**
 * Aggregates 2連単 tickets into formation lines.
 * E.g. "1-234", "2-13" or "1-2".
 */
export function aggregateExactaFormations(
  tickets: TicketPrediction[]
): FormationGroup[] {
  if (tickets.length === 0) return [];

  const ticketMap = new Map<string, TicketPrediction>();
  tickets.forEach((t) => ticketMap.set(t.label, t));
  const remainingKeys = new Set(ticketMap.keys());

  const formations: FormationGroup[] = [];

  // Group by 1st place boat: a-X
  const aMap = new Map<number, number[]>();
  for (const key of remainingKeys) {
    const [a, b] = key.split('-').map(Number);
    if (!aMap.has(a)) aMap.set(a, []);
    aMap.get(a)!.push(b);
  }

  const aEntries = Array.from(aMap.entries()).sort(
    (x, y) => y[1].length - x[1].length
  );
  for (const [a, bList] of aEntries) {
    if (bList.length >= 2) {
      bList.sort((x, y) => x - y);
      const groupTickets: TicketPrediction[] = [];
      for (const b of bList) {
        const k = `${a}-${b}`;
        if (remainingKeys.has(k)) {
          groupTickets.push(ticketMap.get(k)!);
          remainingKeys.delete(k);
        }
      }
      if (groupTickets.length > 0) {
        const formationText = `${a}-${groupTickets
          .map((t) => t.combination[1])
          .sort((x, y) => x - y)
          .join('')}`;
        const totalProbability = groupTickets.reduce(
          (sum, t) => sum + t.probability,
          0
        );
        formations.push({
          formationText,
          tickets: groupTickets,
          ticketCount: groupTickets.length,
          totalProbability,
        });
      }
    }
  }

  // Remaining single tickets
  for (const key of remainingKeys) {
    const t = ticketMap.get(key)!;
    formations.push({
      formationText: t.label,
      tickets: [t],
      ticketCount: 1,
      totalProbability: t.probability,
    });
  }

  formations.sort((x, y) => y.totalProbability - x.totalProbability);
  return formations;
}

/**
 * Aggregates 3連複 tickets into formation lines.
 * E.g. "1=2=345" or "1=2=3".
 */
export function aggregateTrioFormations(
  tickets: TicketPrediction[]
): FormationGroup[] {
  if (tickets.length === 0) return [];

  const ticketMap = new Map<string, TicketPrediction>();
  tickets.forEach((t) => ticketMap.set(t.label, t));
  const remainingKeys = new Set(ticketMap.keys());

  const formations: FormationGroup[] = [];

  // Group by pair (a, b) -> array of c
  const pairMap = new Map<string, number[]>();
  for (const key of remainingKeys) {
    const [a, b, c] = key.split('=').map(Number);
    const pair = `${a}=${b}`;
    if (!pairMap.has(pair)) pairMap.set(pair, []);
    pairMap.get(pair)!.push(c);
  }

  const pairEntries = Array.from(pairMap.entries()).sort(
    (x, y) => y[1].length - x[1].length
  );
  for (const [pair, cList] of pairEntries) {
    if (cList.length >= 2) {
      cList.sort((x, y) => x - y);
      const groupTickets: TicketPrediction[] = [];
      let canForm = true;
      for (const c of cList) {
        const k = `${pair}=${c}`;
        if (!remainingKeys.has(k)) {
          canForm = false;
          break;
        }
      }
      if (canForm) {
        for (const c of cList) {
          const k = `${pair}=${c}`;
          groupTickets.push(ticketMap.get(k)!);
          remainingKeys.delete(k);
        }
        const formationText = `${pair}=${cList.join('')}`;
        const totalProbability = groupTickets.reduce(
          (sum, t) => sum + t.probability,
          0
        );
        formations.push({
          formationText,
          tickets: groupTickets,
          ticketCount: groupTickets.length,
          totalProbability,
        });
      }
    }
  }

  for (const key of remainingKeys) {
    const t = ticketMap.get(key)!;
    formations.push({
      formationText: t.label,
      tickets: [t],
      ticketCount: 1,
      totalProbability: t.probability,
    });
  }

  formations.sort((x, y) => y.totalProbability - x.totalProbability);
  return formations;
}
