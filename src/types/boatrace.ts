export interface BoatData {
  boatNumber: number; // 1 to 6
  racerName: string;
  racerNumber?: number;
  racerClass: 'A1' | 'A2' | 'B1' | 'B2';
  branchName: string; // 支部名 (e.g. "埼玉", "群馬", "福岡")
  nationalWinRate: number; // 全国勝率 (e.g. 5.50)
  nationalTop2Percent: number; // 全国2連率 (e.g. 35.00)
  nationalTop3Percent: number; // 全国3連率 (e.g. 50.00)
  localWinRate?: number; // 当地勝率
  localTop2Percent: number; // 当地2連率
  localTop3Percent: number; // 当地3連率
  motorTop2Percent: number; // モーター2連率
  motorTop3Percent?: number; // モーター3連率
  averageStartTiming: number; // 平均ST (e.g. 0.16)
  exhibitionTime: number | null; // 展示タイム (e.g. 6.65, null if not available)
  startTiming: number | null; // スタート展示ST (e.g. 0.08)
  courseNumber: number; // 進入コース (1 to 6)
  age?: number;
  weight?: number;
}

export interface WeatherData {
  windSpeed: number; // m/s (e.g. 6)
  windDirCode: number | null; // 1-16, 17=無風, null if unknown
  waveHeight: number; // cm
  temperature?: number | null;
  waterTemperature?: number | null;
  weatherName?: string | null;
}

export interface RaceInfo {
  date: string; // YYYY-MM-DD
  stadiumNumber: number; // 1 to 24
  stadiumName: string;
  raceNumber: number; // 1 to 12
  raceTitle: string;
  raceSubtitle?: string;
  closedAt: string; // YYYY-MM-DD HH:mm:ss or HH:mm
  boats: BoatData[];
  weather: WeatherData;
  hasPreviewData: boolean; // whether preview/exhibition was found
}

export interface ModelSliders {
  localTop2: number; // -3.0 to +3.0
  motorTop2: number; // -3.0 to +3.0
  exhibition: number; // -3.0 to +3.0
}

export interface TicketPrediction {
  combination: number[]; // e.g. [1, 2, 3] or [1, 2]
  label: string; // e.g. "1-2-3" or "1=2=3"
  probability: number; // 0 to 1
}

export interface FormationGroup {
  formationText: string; // e.g. "1-2-345" or "12-12-345"
  tickets: TicketPrediction[];
  ticketCount: number;
  totalProbability: number;
}

export interface PredictionResult {
  firstPlaceProbabilities: number[]; // length 6, for boat 1 to 6 (0 to 1)
  trifecta: {
    formations: FormationGroup[];
    allTickets: TicketPrediction[];
    totalCount: number;
  };
  exacta: {
    formations: FormationGroup[];
    allTickets: TicketPrediction[];
    totalCount: number;
  };
  trio: {
    formations: FormationGroup[];
    allTickets: TicketPrediction[];
    totalCount: number;
  };
  windCourseEffects: {
    course: number;
    delta: number; // delta from average (e.g. -0.14)
  }[];
  windSummaryText: string;
  entryIsStandard: boolean; // whether course == boatNumber for all boats
  entryFormationText: string; // e.g. "1-2-3-4-5-6" or "4-1-2-3-5-6"
  entryWarning?: string;
}

export interface StadiumMeta {
  number: number;
  name: string;
  prefecture: string;
  area: '関東' | '東海' | '近畿' | '四国' | '中国' | '九州';
}

export interface RaceScheduleStatus {
  raceNumber: number;
  closedAt: string; // HH:mm or full string
  isDeadline10Min: boolean;
  isClosed: boolean;
  isFinished: boolean;
}
