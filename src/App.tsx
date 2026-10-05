import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { Disclaimer } from './components/Disclaimer';
import { ManualEditor } from './components/ManualEditor';
import { ModelAdjuster } from './components/ModelAdjuster';
import { PWAInstallButton } from './components/PWAInstallButton';
import { RaceResultHeader } from './components/RaceResultHeader';
import { RaceSelector } from './components/RaceSelector';
import { RacerTable } from './components/RacerTable';
import { Recommendations } from './components/Recommendations';
import { SlitFormation } from './components/SlitFormation';
import { WeatherCard } from './components/WeatherCard';
import {
  fetchDateOverview,
  fetchRaceData,
  fetchTodayOverview,
  getTodayJST,
  TodayStadiumStatus,
} from './services/boatraceApi';
import { BoatData, ModelSliders, RaceInfo, WeatherData } from './types/boatrace';
import { predict } from './utils/predictionModel';

const STORAGE_KEY = 'boatrace_ai_state_v1';

export default function App() {
  const todayStr = getTodayJST();

  // Load initial settings from localStorage or defaults
  const savedState = useMemo(() => {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) return JSON.parse(item);
    } catch (e) {
      // Ignore
    }
    return null;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(
    savedState?.date || todayStr
  );
  const [selectedStadium, setSelectedStadium] = useState<number>(
    savedState?.stadium || 2 // 戸田 default
  );
  const [selectedRace, setSelectedRace] = useState<number>(
    savedState?.race || 1
  );

  // Ticket counts (0 to 30)
  const [nTrifecta, setNTrifecta] = useState<number>(
    savedState?.nTrifecta !== undefined ? savedState.nTrifecta : 5
  );
  const [nExacta, setNExacta] = useState<number>(
    savedState?.nExacta !== undefined ? savedState.nExacta : 3
  );
  const [nTrio, setNTrio] = useState<number>(
    savedState?.nTrio !== undefined ? savedState.nTrio : 3
  );

  // Sliders (-3.0 to +3.0)
  const [sliders, setSliders] = useState<ModelSliders>({
    localTop2: savedState?.sliders?.localTop2 ?? 0,
    motorTop2: savedState?.sliders?.motorTop2 ?? 0,
    exhibition: savedState?.sliders?.exhibition ?? 0,
  });

  // Overview of today's stadiums
  const [todayOverview, setTodayOverview] = useState<Map<number, TodayStadiumStatus>>(
    new Map()
  );
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  // Race data & calculation state
  const [raceData, setRaceData] = useState<RaceInfo | null>(null);
  const [editableBoats, setEditableBoats] = useState<BoatData[]>([]);
  const [editableWeather, setEditableWeather] = useState<WeatherData>({
    windSpeed: 0,
    windDirCode: null,
    waveHeight: 0,
  });
  const [editableCourses, setEditableCourses] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const [isLoadingRace, setIsLoadingRace] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Request ID to prevent race conditions from out-of-order responses
  const currentRequestIdRef = useRef<number>(0);

  // Save inputs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          date: selectedDate,
          stadium: selectedStadium,
          race: selectedRace,
          nTrifecta,
          nExacta,
          nTrio,
          sliders,
        })
      );
    } catch (e) {
      // Ignore
    }
  }, [selectedDate, selectedStadium, selectedRace, nTrifecta, nExacta, nTrio, sliders]);

  // Load holding stadiums overview on mount or date change
  useEffect(() => {
    let isCancelled = false;
    async function loadOverview() {
      setIsLoadingOverview(true);
      try {
        const overview = await fetchDateOverview(selectedDate);
        if (!isCancelled) {
          setTodayOverview(overview);
          // If current selected stadium is not among holding stadiums for this date, auto-select first one
          if (overview.size > 0 && !overview.has(selectedStadium)) {
            const firstStadium = Array.from(overview.keys())[0];
            setSelectedStadium(firstStadium);
          }
        }
      } catch (err) {
        console.warn('loadOverview error:', err);
      } finally {
        if (!isCancelled) setIsLoadingOverview(false);
      }
    }
    loadOverview();
    return () => {
      isCancelled = true;
    };
  }, [selectedDate]);

  /**
   * Section 2-3: 「予想する」押下時のリセット
   * ボタン押下時、前回の展示情報（展示タイム、スタート展示、気象・風補正、進入コース、手動修正値）をすべてリセットしてから再取得する。
   * 最新リクエストIDのみ反映。
   */
  const handlePredict = useCallback(
    async (targetDate?: string, targetStadium?: number, targetRace?: number) => {
      const d = targetDate || selectedDate;
      const s = targetStadium || selectedStadium;
      const r = targetRace || selectedRace;

      const reqId = ++currentRequestIdRef.current;

      setIsLoadingRace(true);
      setErrorMessage(null);

      // Reset previous state immediately
      setRaceData(null);
      setEditableBoats([]);
      setEditableWeather({ windSpeed: 0, windDirCode: null, waveHeight: 0 });
      setEditableCourses([1, 2, 3, 4, 5, 6]);

      try {
        const race = await fetchRaceData(d, s, r);

        // Discard if stale request
        if (reqId !== currentRequestIdRef.current) return;

        setRaceData(race);
        setEditableBoats(race.boats);
        setEditableWeather(race.weather);
        setEditableCourses(race.boats.map((b) => b.courseNumber || b.boatNumber));
      } catch (err: any) {
        if (reqId !== currentRequestIdRef.current) return;
        setErrorMessage(
          err?.message ||
            '出走表の取得に失敗しました。通信環境や開催スケジュールをご確認ください。'
        );
      } finally {
        if (reqId === currentRequestIdRef.current) {
          setIsLoadingRace(false);
        }
      }
    },
    [selectedDate, selectedStadium, selectedRace]
  );

  // Auto-run predict on initial mount once overview is ready (or with saved inputs)
  const initialTriggerRef = useRef(false);
  useEffect(() => {
    if (!initialTriggerRef.current) {
      initialTriggerRef.current = true;
      handlePredict();
    }
  }, [handlePredict]);

  // Compute prediction results via pure function
  const predictionResult = useMemo(() => {
    if (!raceData || editableBoats.length !== 6) return null;

    return predict(
      editableBoats,
      editableCourses,
      editableWeather,
      sliders,
      nTrifecta,
      nExacta,
      nTrio
    );
  }, [
    raceData,
    editableBoats,
    editableCourses,
    editableWeather,
    sliders,
    nTrifecta,
    nExacta,
    nTrio,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* App Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-md shadow-sky-950">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg tracking-tight text-white leading-none">
                ボートレースAI予想
              </h1>
              <span className="text-[10px] text-sky-400 font-mono tracking-wider">
                STATISTICAL CONDITIONAL LOGIT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. Input Area */}
        <section aria-label="レース選択と条件入力">
          <RaceSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedStadium={selectedStadium}
            onStadiumChange={setSelectedStadium}
            selectedRace={selectedRace}
            onRaceChange={setSelectedRace}
            nTrifecta={nTrifecta}
            onTrifectaChange={setNTrifecta}
            nExacta={nExacta}
            onExactaChange={setNExacta}
            nTrio={nTrio}
            onTrioChange={setNTrio}
            todayOverview={todayOverview}
            isLoadingOverview={isLoadingOverview}
            onPredict={() => handlePredict()}
            isLoadingRace={isLoadingRace}
          />
        </section>

        {/* Loading Indicator */}
        {isLoadingRace && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3 animate-pulse">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
            <p className="text-slate-200 font-bold text-sm">
              公式出走表・直前展示情報・気象データを取得してAI予想を計算しています...
            </p>
            <p className="text-slate-400 text-xs">
              最新データを取得中（today.json 優先照会）
            </p>
          </div>
        )}

        {/* Error Display */}
        {errorMessage && !isLoadingRace && (
          <div className="bg-red-950/70 border border-red-800 rounded-2xl p-5 text-red-200 space-y-2">
            <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>データ取得エラー</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-red-200">
              {errorMessage}
            </p>
            <p className="text-[11px] text-red-400/90 pt-1">
              ※本日のレースの場合、開始前や展示前などでデータ反映に数分程度の遅れが生じる場合があります。しばらくしてから再度「予想する」をお試しください。
            </p>
          </div>
        )}

        {/* Prediction Results (when data is ready) */}
        {raceData && predictionResult && !isLoadingRace && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 2. Result Header */}
            <RaceResultHeader
              race={raceData}
              entryIsStandard={predictionResult.entryIsStandard}
              entryFormationText={predictionResult.entryFormationText}
              entryWarning={predictionResult.entryWarning}
            />

            {/* 3. Racer Table (Displayed BEFORE recommendations) */}
            <RacerTable
              boats={editableBoats}
              firstPlaceProbabilities={predictionResult.firstPlaceProbabilities}
            />

            {/* 4. Start Exhibition Slit Formation */}
            <SlitFormation boats={editableBoats} />

            {/* 5. Weather & Wind Correction Card */}
            <WeatherCard
              weather={editableWeather}
              windCourseEffects={predictionResult.windCourseEffects}
              windSummaryText={predictionResult.windSummaryText}
            />

            {/* 6. AI Recommended Tickets (1 column) */}
            <Recommendations
              prediction={predictionResult}
              nTrifecta={nTrifecta}
              nExacta={nExacta}
              nTrio={nTrio}
            />

            {/* 7. Accordion: Model Coefficient Sliders */}
            <ModelAdjuster sliders={sliders} onChange={setSliders} />

            {/* 8. Accordion: Manual Adjuster (Exhibition, Weather, Courses) */}
            <ManualEditor
              boats={editableBoats}
              weather={editableWeather}
              courses={editableCourses}
              onBoatsChange={setEditableBoats}
              onWeatherChange={setEditableWeather}
              onCoursesChange={setEditableCourses}
            />
          </div>
        )}

        {/* 9. Disclaimer (Always at bottom) */}
        <Disclaimer />
      </main>
    </div>
  );
}
