import React from 'react';
import { BOAT_COLORS } from '../constants/stadiums';
import { BoatData } from '../types/boatrace';

interface RacerTableProps {
  boats: BoatData[];
  firstPlaceProbabilities: number[]; // length 6, values 0 to 1
}

export const RacerTable: React.FC<RacerTableProps> = ({
  boats,
  firstPlaceProbabilities,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
          <span className="w-2 h-4 rounded-xs bg-sky-500 inline-block"></span>
          出走艇詳細 ＆ AI 1着予測確率
        </h3>
        <span className="text-[11px] text-slate-400">
          ※ 2連率・3連率は小数第2位表示
        </span>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <table className="min-w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 uppercase font-semibold">
                <th className="py-2.5 px-2 text-center w-12">艇番</th>
                <th className="py-2.5 px-2 min-w-[110px]">選手名</th>
                <th className="py-2.5 px-2 text-center w-14">支部</th>
                <th className="py-2.5 px-2 text-center w-12">級別</th>
                <th className="py-2.5 px-2 min-w-[130px] text-left">
                  1着確率
                </th>
                <th className="py-2.5 px-2 text-right">全国勝率</th>
                <th className="py-2.5 px-2 text-right">全国2連率</th>
                <th className="py-2.5 px-2 text-right">全国3連率</th>
                <th className="py-2.5 px-2 text-right">当地2連率</th>
                <th className="py-2.5 px-2 text-right">当地3連率</th>
                <th className="py-2.5 px-2 text-right">モーター2連率</th>
                <th className="py-2.5 px-2 text-right">平均ST</th>
                <th className="py-2.5 px-2 text-right min-w-[65px]">展示タイム</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {boats.map((boat, idx) => {
                const bNum = boat.boatNumber || idx + 1;
                const colorConfig = BOAT_COLORS[bNum] || BOAT_COLORS[1];
                const prob = firstPlaceProbabilities[idx] ?? 0;
                const probPercent = (prob * 100).toFixed(1);

                // Racer class badges
                const rankBadgeColors: Record<string, string> = {
                  A1: 'bg-amber-500/20 text-amber-300 border-amber-600/40',
                  A2: 'bg-sky-500/20 text-sky-300 border-sky-600/40',
                  B1: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
                  B2: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                };

                return (
                  <tr
                    key={bNum}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Boat Number / Official Color */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md border text-xs font-black shadow-xs ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                      >
                        {bNum}
                      </span>
                    </td>

                    {/* Racer Name */}
                    <td className="py-2.5 px-2 font-bold text-slate-100 whitespace-nowrap">
                      {boat.racerName}
                      {boat.racerNumber && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {boat.racerNumber}
                        </span>
                      )}
                    </td>

                    {/* Branch */}
                    <td className="py-2.5 px-2 text-center text-slate-300 whitespace-nowrap font-medium">
                      {boat.branchName || '−'}
                    </td>

                    {/* Rank Class */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          rankBadgeColors[boat.racerClass] || rankBadgeColors.B1
                        }`}
                      >
                        {boat.racerClass}
                      </span>
                    </td>

                    {/* 1st Place Probability & Bar */}
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-100 text-xs w-11 text-right">
                          {probPercent}%
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden min-w-[50px]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, prob * 100))}%`,
                              backgroundColor: colorConfig.hex,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* National Win Rate */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-200">
                      {boat.nationalWinRate !== undefined
                        ? boat.nationalWinRate.toFixed(2)
                        : '−'}
                    </td>

                    {/* National Top 2 % (2 decimals) */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      {boat.nationalTop2Percent !== undefined
                        ? `${boat.nationalTop2Percent.toFixed(2)}%`
                        : '−'}
                    </td>

                    {/* National Top 3 % (2 decimals) */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      {boat.nationalTop3Percent !== undefined
                        ? `${boat.nationalTop3Percent.toFixed(2)}%`
                        : '−'}
                    </td>

                    {/* Local Top 2 % (2 decimals) */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      {boat.localTop2Percent !== undefined
                        ? `${boat.localTop2Percent.toFixed(2)}%`
                        : '−'}
                    </td>

                    {/* Local Top 3 % (2 decimals) */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      {boat.localTop3Percent !== undefined
                        ? `${boat.localTop3Percent.toFixed(2)}%`
                        : '−'}
                    </td>

                    {/* Motor Top 2 % (2 decimals) */}
                    <td className="py-2.5 px-2 text-right font-mono font-medium text-amber-300/90">
                      {boat.motorTop2Percent !== undefined
                        ? `${boat.motorTop2Percent.toFixed(2)}%`
                        : '−'}
                    </td>

                    {/* Average ST */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      {boat.averageStartTiming !== undefined && boat.averageStartTiming > 0
                        ? boat.averageStartTiming.toFixed(2)
                        : '0.16'}
                    </td>

                    {/* Exhibition Time (NO "秒") */}
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-sky-400">
                      {boat.exhibitionTime !== null && boat.exhibitionTime !== undefined
                        ? boat.exhibitionTime.toFixed(2)
                        : '−'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
