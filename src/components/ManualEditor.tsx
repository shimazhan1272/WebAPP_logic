import React, { useState } from 'react';
import { ChevronDown, Edit3 } from 'lucide-react';
import { BOAT_COLORS, WIND_DIRECTION_LABELS } from '../constants/stadiums';
import { BoatData, WeatherData } from '../types/boatrace';

interface ManualEditorProps {
  boats: BoatData[];
  weather: WeatherData;
  courses: number[]; // length 6, course for boat 1 to 6 (1 to 6)
  onBoatsChange: (boats: BoatData[]) => void;
  onWeatherChange: (weather: WeatherData) => void;
  onCoursesChange: (courses: number[]) => void;
}

export const ManualEditor: React.FC<ManualEditorProps> = ({
  boats,
  weather,
  courses,
  onBoatsChange,
  onWeatherChange,
  onCoursesChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Handle exhibition time change
  const handleExTimeChange = (boatIdx: number, valStr: string) => {
    const updated = [...boats];
    const val = parseFloat(valStr);
    updated[boatIdx] = {
      ...updated[boatIdx],
      exhibitionTime: isNaN(val) ? null : val,
    };
    onBoatsChange(updated);
  };

  // Handle course change
  const handleCourseChange = (boatIdx: number, courseVal: number) => {
    const updated = [...courses];
    updated[boatIdx] = courseVal;
    onCoursesChange(updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <Edit3 className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-100 text-sm sm:text-base">
            展示タイム・気象データ・進入コースの手動修正
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            ※変更内容は即座に予想へ反映
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-sky-400' : ''
          }`}
        />
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-4 pb-5 sm:px-6 pt-2 border-t border-slate-800 space-y-5">
          <p className="text-xs text-slate-400">
            直前情報が取得できない場合や、独自の展示タイム・進入想定で試算したい場合に数値を入力してください。変更は即座に反映されます。
          </p>

          {/* 1. Exhibition Times & Course Entry for 6 Boats */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              各艇の展示タイム & 進入コース設定
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {boats.map((b, idx) => {
                const bNum = b.boatNumber || idx + 1;
                const colorCfg = BOAT_COLORS[bNum] || BOAT_COLORS[1];
                const currentCourse = courses[idx] ?? bNum;

                return (
                  <div
                    key={bNum}
                    className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800"
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-black shrink-0 ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border}`}
                    >
                      {bNum}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold text-slate-200 truncate">
                        {b.racerName}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Exhibition time input */}
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-slate-400">展示:</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="6.65"
                            value={b.exhibitionTime ?? ''}
                            onChange={(e) => handleExTimeChange(idx, e.target.value)}
                            className="w-16 h-7 px-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        {/* Course entry select */}
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-slate-400">進入:</label>
                          <select
                            value={currentCourse}
                            onChange={(e) => handleCourseChange(idx, Number(e.target.value))}
                            className="h-7 px-1.5 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold focus:ring-1 focus:ring-sky-500 cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5, 6].map((c) => (
                              <option key={c} value={c}>
                                {c}C
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Weather & Wind Inputs */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              気象・風速・風向・波高の設定
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Wind Speed */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  風速 (m/s)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={weather.windSpeed}
                  onChange={(e) =>
                    onWeatherChange({
                      ...weather,
                      windSpeed: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-bold font-mono focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Wind Direction Code / Preset */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  風向（コード / プリセット）
                </label>
                <select
                  value={weather.windDirCode ?? 17}
                  onChange={(e) =>
                    onWeatherChange({
                      ...weather,
                      windDirCode: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 px-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-bold focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="17">無風 / 不明 (17)</option>
                  <option value="5">追い風 (真追い・コード5)</option>
                  <option value="4">追い風 (コード4)</option>
                  <option value="6">追い風 (コード6)</option>
                  <option value="13">向かい風 (真向かい・コード13)</option>
                  <option value="12">向かい風 (コード12)</option>
                  <option value="14">向かい風 (コード14)</option>
                  <option value="9">横風A (右横風・コード9)</option>
                  <option value="1">横風B (左横風・コード1)</option>
                  {/* Complete 1 to 16 */}
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((code) => {
                    if ([5, 4, 6, 13, 12, 14, 9, 1].includes(code)) return null;
                    return (
                      <option key={code} value={code}>
                        {WIND_DIRECTION_LABELS[code] || `風向コード ${code}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Wave Height */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  波高 (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={weather.waveHeight}
                  onChange={(e) =>
                    onWeatherChange({
                      ...weather,
                      waveHeight: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-bold font-mono focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
