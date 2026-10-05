import React, { useState } from 'react';
import { ChevronDown, RotateCcw, Sliders } from 'lucide-react';
import { ModelSliders } from '../types/boatrace';
import { CONFIG } from '../utils/predictionModel';

interface ModelAdjusterProps {
  sliders: ModelSliders;
  onChange: (sliders: ModelSliders) => void;
}

export const ModelAdjuster: React.FC<ModelAdjusterProps> = ({
  sliders,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Compute effective coefficients
  const effectiveLocalTop2 = (CONFIG.cL2 * (1 + sliders.localTop2 / 3)).toFixed(4);
  const effectiveMotorTop2 = (CONFIG.cM2 * (1 + sliders.motorTop2 / 3)).toFixed(4);
  // Exhibition coefficient average or 1コース reference
  const effectiveEx1 = (CONFIG.EX_COEF[0] * (1 + sliders.exhibition / 3)).toFixed(3);

  const resetAll = () => {
    onChange({
      localTop2: 0,
      motorTop2: 0,
      exhibition: 0,
    });
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
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-100 text-sm sm:text-base">
            予想モデル係数調整（スライダー3項目）
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            ※実効係数 = 基準値 × (1 + スライダー/3)
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
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              スライダーを動かすと即座に予想確率と買い目が再計算されます（API再取得なし）。
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-sky-400" />
              <span>全項目を0に戻す</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* 1. 当地2連率 */}
            <SliderItem
              label="当地2連率"
              baseValue={CONFIG.cL2}
              sliderValue={sliders.localTop2}
              effectiveText={`${effectiveLocalTop2}`}
              onSliderChange={(val) => onChange({ ...sliders, localTop2: val })}
              onReset={() => onChange({ ...sliders, localTop2: 0 })}
            />

            {/* 2. モーター2連率 */}
            <SliderItem
              label="モーター2連率"
              baseValue={CONFIG.cM2}
              sliderValue={sliders.motorTop2}
              effectiveText={`${effectiveMotorTop2}`}
              onSliderChange={(val) => onChange({ ...sliders, motorTop2: val })}
              onReset={() => onChange({ ...sliders, motorTop2: 0 })}
            />

            {/* 3. 展示タイム補正 */}
            <SliderItem
              label="展示タイム補正"
              baseValue={CONFIG.EX_COEF[0]}
              baseNote="(1C基準 2.768)"
              sliderValue={sliders.exhibition}
              effectiveText={`1C: ${effectiveEx1}`}
              onSliderChange={(val) => onChange({ ...sliders, exhibition: val })}
              onReset={() => onChange({ ...sliders, exhibition: 0 })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface SliderItemProps {
  label: string;
  baseValue: number;
  baseNote?: string;
  sliderValue: number;
  effectiveText: string;
  onSliderChange: (val: number) => void;
  onReset: () => void;
}

const SliderItem: React.FC<SliderItemProps> = ({
  label,
  baseValue,
  baseNote,
  sliderValue,
  effectiveText,
  onSliderChange,
  onReset,
}) => {
  return (
    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200 text-xs sm:text-sm">
            {label}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            基準値: {baseValue} {baseNote || ''}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-slate-300">
            スライダー: <strong className="text-sky-400 font-bold">{sliderValue > 0 ? `+${sliderValue.toFixed(1)}` : sliderValue.toFixed(1)}</strong>
          </span>
          <span className="text-slate-500">→</span>
          <span className="font-mono text-slate-200 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
            実効: {effectiveText}
          </span>
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-slate-400 hover:text-sky-300 underline ml-1 cursor-pointer"
          >
            0に戻す
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-400 font-mono w-10 text-right">
          -3.0 (無効)
        </span>
        <input
          type="range"
          min="-3.0"
          max="3.0"
          step="0.1"
          value={sliderValue}
          onChange={(e) => onSliderChange(parseFloat(e.target.value))}
          className="flex-1 accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
        />
        <span className="text-[10px] text-slate-400 font-mono w-10 text-left">
          +3.0 (2倍)
        </span>
      </div>
    </div>
  );
};
