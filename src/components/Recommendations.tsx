import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Layers, Sparkles } from 'lucide-react';
import { BOAT_COLORS } from '../constants/stadiums';
import { FormationGroup, PredictionResult, TicketPrediction } from '../types/boatrace';

interface RecommendationsProps {
  prediction: PredictionResult;
  nTrifecta: number;
  nExacta: number;
  nTrio: number;
}

export const Recommendations: React.FC<RecommendationsProps> = ({
  prediction,
  nTrifecta,
  nExacta,
  nTrio,
}) => {
  const totalPoints =
    (nTrifecta > 0 ? prediction.trifecta.totalCount : 0) +
    (nExacta > 0 ? prediction.exacta.totalCount : 0) +
    (nTrio > 0 ? prediction.trio.totalCount : 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
          <h3 className="font-extrabold text-slate-100 text-base sm:text-lg">
            AI推奨買い目
          </h3>
        </div>
        <div className="text-xs sm:text-sm font-semibold text-slate-300">
          合計推奨点数:{' '}
          <strong className="text-amber-400 font-mono text-base font-black">
            {totalPoints}
          </strong>{' '}
          点
        </div>
      </div>

      {/* Probability Explanation Note */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">確率(%)の定義:</strong>{' '}
          各買い目がその着順で入る確率（モデル推定値）。フォーメーション行は含まれる買い目の確率の合計です。
        </p>
      </div>

      {/* 1 Column Layout */}
      <div className="space-y-5">
        {/* 3連単 */}
        {nTrifecta > 0 && prediction.trifecta.totalCount > 0 && (
          <BetTypeSection
            title="3連単"
            badge="Trifecta"
            badgeColor="bg-amber-950/80 text-amber-300 border-amber-800"
            count={prediction.trifecta.totalCount}
            formations={prediction.trifecta.formations}
          />
        )}

        {/* 2連単 */}
        {nExacta > 0 && prediction.exacta.totalCount > 0 && (
          <BetTypeSection
            title="2連単"
            badge="Exacta"
            badgeColor="bg-sky-950/80 text-sky-300 border-sky-800"
            count={prediction.exacta.totalCount}
            formations={prediction.exacta.formations}
          />
        )}

        {/* 3連複 */}
        {nTrio > 0 && prediction.trio.totalCount > 0 && (
          <BetTypeSection
            title="3連複"
            badge="Trio"
            badgeColor="bg-emerald-950/80 text-emerald-300 border-emerald-800"
            count={prediction.trio.totalCount}
            formations={prediction.trio.formations}
            isTrio
          />
        )}

        {totalPoints === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm">
            買い目点数がすべて0点に設定されています。上部の点数プルダウンで点数を指定してください。
          </div>
        )}
      </div>
    </div>
  );
};

interface BetTypeSectionProps {
  title: string;
  badge: string;
  badgeColor: string;
  count: number;
  formations: FormationGroup[];
  isTrio?: boolean;
}

const BetTypeSection: React.FC<BetTypeSectionProps> = ({
  title,
  badge,
  badgeColor,
  count,
  formations,
  isTrio,
}) => {
  return (
    <div className="bg-slate-950/50 border border-slate-800/90 rounded-xl p-3.5 sm:p-4">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-100 text-sm sm:text-base">
            {title}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeColor}`}
          >
            {badge}
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-slate-300">
          {count} 点
        </span>
      </div>

      {/* Formation Rows */}
      <div className="space-y-2">
        {formations.map((f, idx) => (
          <FormationRow key={idx} formation={f} isTrio={isTrio} />
        ))}
      </div>
    </div>
  );
};

const FormationRow: React.FC<{ formation: FormationGroup; isTrio?: boolean }> = ({
  formation,
  isTrio,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const probPercent = (formation.totalProbability * 100).toFixed(1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-colors hover:border-slate-700">
      {/* Formation Main Row */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <FormationBadge text={formation.formationText} isTrio={isTrio} />
          <span className="text-xs text-slate-400 font-mono font-medium">
            ({formation.ticketCount}点)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-normal leading-none">
              合算確率
            </span>
            <span className="font-mono font-black text-sm text-sky-400">
              {probPercent}%
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180 text-sky-400' : ''
            }`}
          />
        </div>
      </div>

      {/* Expanded Individual Tickets */}
      {isOpen && (
        <div className="px-3.5 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/60 text-xs">
          <div className="text-[11px] text-slate-400 mb-2 flex items-center gap-1 font-medium">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>内訳買い目・個別モデル確率:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {formation.tickets.map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs"
              >
                <span className="font-bold text-slate-200">{t.label}</span>
                <span className="text-slate-400 text-[11px]">
                  {(t.probability * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Render styled visual badge for formation string (e.g. 1-2-345)
const FormationBadge: React.FC<{ text: string; isTrio?: boolean }> = ({
  text,
  isTrio,
}) => {
  const parts = isTrio ? text.split('=') : text.split('-');
  const separator = isTrio ? '=' : '-';

  return (
    <div className="flex items-center gap-1 font-mono font-extrabold text-sm sm:text-base tracking-wider">
      {parts.map((part, pIdx) => (
        <React.Fragment key={pIdx}>
          {pIdx > 0 && <span className="text-slate-500 font-normal">{separator}</span>}
          <span className="inline-flex items-center gap-0.5">
            {part.split('').map((char, cIdx) => {
              const bNum = Number(char);
              const colorCfg = !isNaN(bNum) ? BOAT_COLORS[bNum] : null;
              if (colorCfg) {
                return (
                  <span
                    key={cIdx}
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-black shadow-xs ${colorCfg.bg} ${colorCfg.text} ${colorCfg.border}`}
                  >
                    {char}
                  </span>
                );
              }
              return (
                <span key={cIdx} className="text-white">
                  {char}
                </span>
              );
            })}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};
