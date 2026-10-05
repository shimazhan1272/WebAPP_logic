import React from 'react';
import { Timer } from 'lucide-react';
import { BOAT_COLORS } from '../constants/stadiums';
import { BoatData } from '../types/boatrace';

interface SlitFormationProps {
  boats: BoatData[];
}

export const SlitFormation: React.FC<SlitFormationProps> = ({ boats }) => {
  // Sort boats by entered course number (1 to 6)
  const courseSortedBoats = [...boats].sort(
    (a, b) => a.courseNumber - b.courseNumber
  );

  // SVG viewBox geometry (740 x 285)
  // Perfectly responsive without any horizontal scrollbar
  const width = 740;
  const height = 285;
  const topHeaderY = 24;
  const rowStartY = 60;
  const rowHeight = 37;

  // Slit area geometry
  const slitAreaStartX = 430;
  const slitAreaEndX = 725;
  const startLineX = 660; // Start slit line position

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
          <Timer className="w-4 h-4 text-sky-400" />
          <span>スタート展示スリット隊形 ＆ 展示タイム</span>
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          ※ 進入コース順（展示タイム・ST・スリット隊形）
        </span>
      </div>

      {/* No horizontal scroll: w-full and overflow-hidden */}
      <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 sm:p-3 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block font-sans select-none"
        >
          <defs>
            {/* Water gradient background for slit area */}
            <linearGradient id="slitWaterGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#020d1a" />
              <stop offset="70%" stopColor="#082244" />
              <stop offset="100%" stopColor="#041428" />
            </linearGradient>
            <filter id="boatCircleShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* Table Header Labels (Large, clear fonts) */}
          <text x="18" y={topHeaderY} fill="#94a3b8" fontSize="13" fontWeight="bold">
            コース
          </text>
          <text x="95" y={topHeaderY} fill="#94a3b8" fontSize="13" fontWeight="bold">
            選手名
          </text>
          <text x="235" y={topHeaderY} fill="#38bdf8" fontSize="13" fontWeight="bold">
            展示タイム
          </text>
          <text x="340" y={topHeaderY} fill="#fbbf24" fontSize="13" fontWeight="bold">
            スタート展示ST
          </text>

          {/* Slit Area Header */}
          <text
            x={(slitAreaStartX + slitAreaEndX) / 2}
            y={topHeaderY}
            fill="#94a3b8"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
          >
            ← 助走方向 ｜ スタートライン
          </text>

          {/* Slit Water Pool Background */}
          <rect
            x={slitAreaStartX}
            y="36"
            width={slitAreaEndX - slitAreaStartX}
            height={height - 44}
            rx="8"
            fill="url(#slitWaterGrad)"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* Start Line */}
          <line
            x1={startLineX}
            y1="40"
            x2={startLineX}
            y2={height - 14}
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeDasharray="6 3"
          />
          <text
            x={startLineX}
            y="52"
            fill="#f87171"
            fontSize="11"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="monospace"
          >
            START
          </text>

          {/* 6 Course Rows */}
          {courseSortedBoats.map((boat, idx) => {
            const courseNum = boat.courseNumber || idx + 1;
            const bNum = boat.boatNumber;
            const colorCfg = BOAT_COLORS[bNum] || BOAT_COLORS[1];
            const y = rowStartY + idx * rowHeight;

            // ST mapping
            const rawSt = boat.startTiming;
            const hasSt = rawSt !== null && rawSt !== undefined && !isNaN(rawSt);
            const stVal = hasSt ? rawSt : 0.16;

            // 0.01 ST ≈ 8.5 pixels
            // ST > 0 (normal) is left of startLineX
            // ST < 0 (flying) is right of startLineX
            const xPos = Math.max(
              slitAreaStartX + 22,
              Math.min(slitAreaEndX - 18, startLineX - stVal * 850)
            );

            // ST display string
            let stText = '−';
            let isFlying = false;
            if (hasSt) {
              if (rawSt < 0) {
                isFlying = true;
                stText = `F.${Math.abs(rawSt * 100).toFixed(0).padStart(2, '0')}`;
              } else {
                stText = `.${(rawSt * 100).toFixed(0).padStart(2, '0')}`;
              }
            }

            // Exhibition display string (without "秒")
            const exText =
              boat.exhibitionTime !== null &&
              boat.exhibitionTime !== undefined &&
              boat.exhibitionTime > 0
                ? boat.exhibitionTime.toFixed(2)
                : '−';

            return (
              <g key={`course-row-${bNum}`} className="transition-all duration-200">
                {/* Lane Separator Line */}
                <line
                  x1="12"
                  y1={y + 14}
                  x2={width - 15}
                  y2={y + 14}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* 1. Course Label */}
                <text
                  x="18"
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {courseNum}コース
                </text>

                {/* 2. Racer Name */}
                <text
                  x="95"
                  y={y + 4}
                  fill="#f8fafc"
                  fontSize="15"
                  fontWeight="bold"
                >
                  {boat.racerName.slice(0, 6)}
                </text>

                {/* 3. Exhibition Time (選手名の右隣) */}
                <text
                  x="235"
                  y={y + 4}
                  fill="#38bdf8"
                  fontSize="15"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {exText}
                </text>

                {/* 4. Start Exhibition ST (展示タイムの右隣) */}
                <text
                  x="340"
                  y={y + 4}
                  fill={isFlying ? '#f87171' : '#fbbf24'}
                  fontSize="15"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {stText}
                </text>

                {/* 5. Slit Area Track & Boat Circle */}
                {/* Distance wake line */}
                <line
                  x1={slitAreaStartX + 10}
                  y1={y}
                  x2={xPos - 14}
                  y2={y}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                />

                {/* Boat Circle in Slit (Filled with official frame color) */}
                <circle
                  cx={xPos}
                  cy={y}
                  r="13"
                  fill={colorCfg.hex}
                  stroke={bNum === 1 ? '#0f172a' : '#ffffff'}
                  strokeWidth="2"
                  filter="url(#boatCircleShadow)"
                />
                <text
                  x={xPos}
                  y={y + 5}
                  fill={bNum === 1 || bNum === 5 ? '#0f172a' : '#ffffff'}
                  fontSize="14"
                  fontWeight="900"
                  textAnchor="middle"
                >
                  {bNum}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
