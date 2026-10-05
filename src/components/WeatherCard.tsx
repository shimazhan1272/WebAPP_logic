import React from 'react';
import { Compass, Waves, Wind } from 'lucide-react';
import { WIND_DIRECTION_LABELS } from '../constants/stadiums';
import { WeatherData } from '../types/boatrace';
import { getWindDirectionDescription } from '../utils/predictionModel';

interface WeatherCardProps {
  weather: WeatherData;
  windCourseEffects: { course: number; delta: number }[];
  windSummaryText: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  windCourseEffects,
  windSummaryText,
}) => {
  const dirLabel =
    weather.windDirCode && WIND_DIRECTION_LABELS[weather.windDirCode]
      ? WIND_DIRECTION_LABELS[weather.windDirCode]
      : weather.windDirCode && weather.windDirCode < 17
      ? `風向コード ${weather.windDirCode}`
      : '無風 / 不明';

  const dirCategory = getWindDirectionDescription(
    weather.windDirCode,
    weather.windSpeed
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
          <Wind className="w-4 h-4 text-sky-400" />
          <span>気象情報 ＆ 風向・風速補正</span>
        </h3>
        <span className="text-[11px] text-slate-400">
          水面条件による各コース有利・不利を統計モデルに反映
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-3">
        {/* Wind Speed */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center shrink-0">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-medium">風速</span>
            <span className="text-base sm:text-lg font-black font-mono text-slate-100">
              {weather.windSpeed} <span className="text-xs font-normal text-slate-400">m</span>
            </span>
          </div>
        </div>

        {/* Wind Direction */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="block text-[11px] text-slate-400 font-medium">風向</span>
            <span className="text-xs sm:text-sm font-bold text-slate-100 truncate block">
              {weather.windSpeed > 0 ? `${dirCategory} (${dirLabel})` : '無風'}
            </span>
          </div>
        </div>

        {/* Wave Height */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center shrink-0">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-medium">波高</span>
            <span className="text-base sm:text-lg font-black font-mono text-slate-100">
              {weather.waveHeight} <span className="text-xs font-normal text-slate-400">cm</span>
            </span>
          </div>
        </div>
      </div>

      {/* Course Wind Delta Summary */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs">
        <div className="text-slate-400 mb-1.5 font-medium flex items-center justify-between">
          <span>コース別の風の効果（コース平均からのスコア差）</span>
          <span className="text-[10px] text-slate-400 font-mono">
            +有利 / −不利
          </span>
        </div>
        <div className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold">
          {windSummaryText}
        </div>
      </div>
    </div>
  );
};
