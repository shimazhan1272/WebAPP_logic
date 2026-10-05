import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, Clock, MapPin, RefreshCw, Trophy, Zap } from 'lucide-react';
import { STADIUM_MAP, STADIUMS } from '../constants/stadiums';
import { getCurrentJSTTime, getTodayJST, TodayStadiumStatus } from '../services/boatraceApi';

interface RaceSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedStadium: number;
  onStadiumChange: (stadium: number) => void;
  selectedRace: number;
  onRaceChange: (race: number) => void;
  nTrifecta: number;
  onTrifectaChange: (count: number) => void;
  nExacta: number;
  onExactaChange: (count: number) => void;
  nTrio: number;
  onTrioChange: (count: number) => void;
  todayOverview: Map<number, TodayStadiumStatus>;
  isLoadingOverview: boolean;
  onPredict: () => void;
  isLoadingRace: boolean;
}

export const RaceSelector: React.FC<RaceSelectorProps> = ({
  selectedDate,
  onDateChange,
  selectedStadium,
  onStadiumChange,
  selectedRace,
  onRaceChange,
  nTrifecta,
  onTrifectaChange,
  nExacta,
  onExactaChange,
  nTrio,
  onTrioChange,
  todayOverview,
  isLoadingOverview,
  onPredict,
  isLoadingRace,
}) => {
  const [stadiumDropdownOpen, setStadiumDropdownOpen] = useState(false);
  const [raceDropdownOpen, setRaceDropdownOpen] = useState(false);
  const stadiumDropdownRef = useRef<HTMLDivElement>(null);
  const raceDropdownRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  // Auto-refresh clock state every 10 seconds to keep deadline status fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Close custom dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        stadiumDropdownRef.current &&
        !stadiumDropdownRef.current.contains(e.target as Node)
      ) {
        setStadiumDropdownOpen(false);
      }
      if (
        raceDropdownRef.current &&
        !raceDropdownRef.current.contains(e.target as Node)
      ) {
        setRaceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayStr = getTodayJST();
  const isToday = selectedDate === todayStr;

  // Filter stadiums: ONLY show stadiums holding races on the selected date!
  const availableStadiums = useMemo(() => {
    if (todayOverview.size > 0) {
      return STADIUMS.filter((s) => todayOverview.has(s.number)).map((s) => {
        const status = todayOverview.get(s.number);
        return {
          ...s,
          isAllFinished: status?.isAllFinished ?? false,
        };
      });
    }
    // If not loaded yet or empty, show current selected stadium fallback
    const fallbackMeta = STADIUM_MAP.get(selectedStadium);
    if (fallbackMeta) {
      return [{ ...fallbackMeta, isAllFinished: false }];
    }
    return [];
  }, [todayOverview, selectedStadium]);

  // Adjust selected stadium if current one is not held on this date
  useEffect(() => {
    if (
      availableStadiums.length > 0 &&
      !availableStadiums.some((s) => s.number === selectedStadium)
    ) {
      onStadiumChange(availableStadiums[0].number);
    }
  }, [availableStadiums, selectedStadium, onStadiumChange]);

  // Schedule for current stadium
  const currentStadiumSchedule = useMemo(() => {
    return todayOverview.get(selectedStadium)?.races || [];
  }, [todayOverview, selectedStadium]);

  // Compute selected stadium display label: e.g. 【終了】24_大村 or 02_戸田
  const selectedStadiumStatus = todayOverview.get(selectedStadium);
  const isSelectedStadiumFinished = selectedStadiumStatus?.isAllFinished ?? false;
  const currentStadiumMeta =
    availableStadiums.find((s) => s.number === selectedStadium) ||
    STADIUM_MAP.get(selectedStadium);
  const stadiumCodeStr =
    selectedStadium < 10 ? `0${selectedStadium}` : `${selectedStadium}`;
  const stadiumNameStr = currentStadiumMeta?.name || `場${selectedStadium}`;
  const selectedStadiumDisplayText = isSelectedStadiumFinished
    ? `【終了】${stadiumCodeStr}_${stadiumNameStr}`
    : `${stadiumCodeStr}_${stadiumNameStr}`;

  // Helper to compute race deadline status
  const getRaceStatus = (rNum: number) => {
    const raceItem = currentStadiumSchedule.find((r) => r.raceNumber === rNum);
    const closedTimeStr = raceItem?.closedAt || '';
    const fullClosedAt = raceItem?.fullClosedAt || '';

    let isDeadline10Min = false;
    let isClosed = false;
    let isFinished = raceItem?.isFinished || false;

    if (fullClosedAt) {
      const nowJst = getCurrentJSTTime();
      const raceTime = new Date(fullClosedAt.replace(/-/g, '/'));
      if (!isNaN(raceTime.getTime())) {
        const diffMs = raceTime.getTime() - nowJst.getTime();
        const diffMin = diffMs / 60000;
        if (diffMin <= 10 && diffMin >= 0) {
          isDeadline10Min = true;
        } else if (diffMin < 0) {
          isClosed = true;
        }
      }
    }

    const isDone = isFinished || isClosed;
    let displayText = `${rNum}R`;
    if (isDone) {
      displayText = `【終了】${rNum}R`;
    } else if (closedTimeStr) {
      displayText = `${rNum}R ${closedTimeStr}締切`;
    }

    return {
      rNum,
      closedTimeStr,
      displayText,
      isDeadline10Min,
      isClosed,
      isFinished: isDone,
    };
  };

  const selectedRaceStatus = getRaceStatus(selectedRace);

  // 0 to 30 integer options for ticket counts
  const countOptions = Array.from({ length: 31 }, (_, i) => i);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Date Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>開催年月日</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium cursor-pointer"
          />
        </div>

        {/* 2. Stadium Custom Dropdown (Only shows holding stadiums!) */}
        <div className="relative" ref={stadiumDropdownRef}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>レース場（開催場のみ）</span>
            </span>
            <span className="text-[10px] text-sky-400 bg-sky-950/70 border border-sky-800/80 px-1.5 py-0.5 rounded">
              {isLoadingOverview
                ? '確認中...'
                : `開催中: ${availableStadiums.length}場`}
            </span>
          </label>

          {/* Trigger button */}
          <button
            type="button"
            disabled={isLoadingOverview && availableStadiums.length === 0}
            onClick={() => setStadiumDropdownOpen(!stadiumDropdownOpen)}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-between text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer disabled:opacity-60"
          >
            <span
              className={`truncate ${
                isSelectedStadiumFinished ? 'text-slate-400' : 'text-slate-100 font-bold'
              }`}
            >
              {isLoadingOverview && availableStadiums.length === 0
                ? '開催場を読み込み中...'
                : selectedStadiumDisplayText}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                stadiumDropdownOpen ? 'rotate-180 text-sky-400' : ''
              }`}
            />
          </button>

          {/* Stadium Dropdown Menu */}
          {stadiumDropdownOpen && (
            <div className="absolute z-40 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              {availableStadiums.length === 0 ? (
                <div className="py-3 px-3 text-xs text-slate-400 text-center">
                  該当日の開催情報が見つかりません
                </div>
              ) : (
                availableStadiums.map((s) => {
                  const sCode = s.number < 10 ? `0${s.number}` : `${s.number}`;
                  const label = s.isAllFinished
                    ? `【終了】${sCode}_${s.name}`
                    : `${sCode}_${s.name}`;
                  const isSelected = selectedStadium === s.number;

                  return (
                    <button
                      key={s.number}
                      type="button"
                      onClick={() => {
                        onStadiumChange(s.number);
                        setStadiumDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-600/30 text-white font-bold border border-sky-500/50'
                          : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <span
                        className={
                          s.isAllFinished
                            ? 'text-slate-400 font-medium'
                            : isSelected
                            ? 'text-white font-bold'
                            : 'text-slate-200'
                        }
                      >
                        {label}
                      </span>
                      {s.isAllFinished && (
                        <span className="text-[10px] text-slate-500 font-semibold px-1.5 py-0.5 rounded bg-slate-800">
                          全R終了
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 3. Race Number Custom Dropdown */}
        <div className="relative" ref={raceDropdownRef}>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-sky-400" />
              <span>レース番号</span>
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              締切10分前=赤 / 終了=【終了】
            </span>
          </label>

          {/* Trigger button */}
          <button
            type="button"
            onClick={() => setRaceDropdownOpen(!raceDropdownOpen)}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-between text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <span
              className={`truncate ${
                selectedRaceStatus.isDeadline10Min
                  ? 'text-red-400 font-bold animate-pulse'
                  : selectedRaceStatus.isFinished
                  ? 'text-slate-400'
                  : 'text-slate-100 font-bold'
              }`}
            >
              {selectedRaceStatus.displayText}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                raceDropdownOpen ? 'rotate-180 text-sky-400' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {raceDropdownOpen && (
            <div className="absolute z-40 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((rNum) => {
                const status = getRaceStatus(rNum);
                const isSelected = selectedRace === rNum;
                return (
                  <button
                    key={rNum}
                    type="button"
                    onClick={() => {
                      onRaceChange(rNum);
                      setRaceDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600/30 text-white font-bold border border-sky-500/50'
                        : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <span
                      className={`${
                        status.isDeadline10Min
                          ? 'text-red-400 font-bold'
                          : status.isFinished
                          ? 'text-slate-400 font-medium'
                          : isSelected
                          ? 'text-white font-bold'
                          : 'text-slate-200'
                      }`}
                    >
                      {status.displayText}
                    </span>
                    {status.isDeadline10Min && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                        締切間近
                      </span>
                    )}
                    {status.isFinished && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        終了
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Prediction Button */}
        <div className="flex items-end">
          <button
            onClick={onPredict}
            disabled={isLoadingRace}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-sky-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingRace ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>解析・予想中...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>AI予想する</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Ticket Count Selectors (0 to 30 Pulldowns) */}
      <div className="mt-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">
            買い目点数の指定（各0〜30点・変更時即時再計算）
          </span>
          <span className="text-[11px] text-slate-400">
            合計: <strong className="text-sky-400 font-bold">{nTrifecta + nExacta + nTrio}</strong> 点
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {/* 3連単 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              3連単 点数
            </label>
            <div className="relative">
              <select
                value={nTrifecta}
                onChange={(e) => onTrifectaChange(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer pr-8"
              >
                {countOptions.map((cnt) => (
                  <option key={cnt} value={cnt}>
                    {cnt} 点 {cnt === 0 ? '(非表示)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2連単 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              2連単 点数
            </label>
            <div className="relative">
              <select
                value={nExacta}
                onChange={(e) => onExactaChange(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer pr-8"
              >
                {countOptions.map((cnt) => (
                  <option key={cnt} value={cnt}>
                    {cnt} 点 {cnt === 0 ? '(非表示)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3連複 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              3連複 点数
            </label>
            <div className="relative">
              <select
                value={nTrio}
                onChange={(e) => onTrioChange(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer pr-8"
              >
                {countOptions.map((cnt) => (
                  <option key={cnt} value={cnt}>
                    {cnt} 点 {cnt === 0 ? '(非表示)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
