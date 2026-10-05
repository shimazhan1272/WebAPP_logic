import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Clock, Flag } from 'lucide-react';
import { RaceInfo } from '../types/boatrace';
import { getCurrentJSTTime } from '../services/boatraceApi';

interface RaceResultHeaderProps {
  race: RaceInfo;
  entryIsStandard: boolean;
  entryFormationText: string;
  entryWarning?: string;
}

export const RaceResultHeader: React.FC<RaceResultHeaderProps> = ({
  race,
  entryIsStandard,
  entryFormationText,
  entryWarning,
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute deadline state
  const nowJst = getCurrentJSTTime();
  let isDeadline10Min = false;
  let isClosed = false;
  let isFinished = false;
  let minutesLeft: number | null = null;

  if (race.closedAt) {
    const raceTime = new Date(race.closedAt.replace(/-/g, '/'));
    if (!isNaN(raceTime.getTime())) {
      const diffMs = raceTime.getTime() - nowJst.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      minutesLeft = diffMin;

      if (diffMin <= 10 && diffMin >= 0) {
        isDeadline10Min = true;
      } else if (diffMin < 0) {
        isClosed = true;
        if (diffMin < -15) {
          isFinished = true;
        }
      }
    }
  }

  const closedTimeFormatted = race.closedAt
    ? race.closedAt.split(' ')[1]?.slice(0, 5) || race.closedAt
    : '−';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Stadium & Race Title */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-sky-950 text-sky-400 border border-sky-800 font-extrabold text-lg sm:text-xl">
            {race.stadiumName}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xl sm:text-2xl font-black ${
                  isDeadline10Min
                    ? 'text-red-400 animate-pulse'
                    : isFinished || isClosed
                    ? 'text-slate-400'
                    : 'text-white'
                }`}
              >
                {isFinished || isClosed ? `【終了】${race.raceNumber}R` : `${race.raceNumber}R`}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-200 truncate max-w-xs sm:max-w-md">
                {race.raceTitle}
              </h2>
              {race.raceSubtitle && (
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {race.raceSubtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Deadline Information */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">締切:</span>
            <span
              className={`font-mono font-bold ${
                isDeadline10Min
                  ? 'text-red-400'
                  : isClosed
                  ? 'text-slate-400'
                  : 'text-slate-100'
              }`}
            >
              {closedTimeFormatted}
            </span>
          </div>

          {/* Status Badge */}
          {isDeadline10Min && (
            <span className="px-2.5 py-1 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs font-bold animate-pulse flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              締切10分前 ({minutesLeft !== null ? `${minutesLeft}分` : ''})
            </span>
          )}
          {!isDeadline10Min && isClosed && (
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
              {isFinished ? '【終了】' : '発売締切'}
            </span>
          )}
        </div>
      </div>

      {/* Entry Formation Notice (if non-standard / 前付けあり) */}
      {!entryIsStandard && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs sm:text-sm flex items-center gap-2">
          <Flag className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <strong className="text-amber-300 font-bold">
              前付けあり（進入が枠なりと異なる）
            </strong>
            <span className="ml-2 font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-amber-700">
              隊形: {entryFormationText}
            </span>
          </div>
        </div>
      )}

      {/* Course Duplication Warning */}
      {entryWarning && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{entryWarning}</span>
        </div>
      )}
    </div>
  );
};
