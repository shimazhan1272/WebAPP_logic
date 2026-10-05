import { getBranchName, STADIUM_MAP } from '../constants/stadiums';
import { BoatData, RaceInfo, WeatherData } from '../types/boatrace';

// Helper to get current Date in JST (UTC+9) formatted as YYYY-MM-DD
export function getTodayJST(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utc + 9 * 3600000);
  const yyyy = jst.getFullYear();
  const mm = String(jst.getMonth() + 1).padStart(2, '0');
  const dd = String(jst.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getCurrentJSTTime(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 3600000);
}

export interface TodayStadiumStatus {
  stadiumNumber: number;
  stadiumName: string;
  races: {
    raceNumber: number;
    closedAt: string; // e.g. "10:45"
    fullClosedAt: string; // e.g. "2026-10-05 10:45:00"
    isFinished: boolean;
  }[];
  isAllFinished: boolean;
}

/**
 * Fetch today's holding stadiums and race schedules
 */
export async function fetchTodayOverview(): Promise<Map<number, TodayStadiumStatus>> {
  const result = new Map<number, TodayStadiumStatus>();
  try {
    const url = `https://boatraceopenapi.github.io/api/v1/today.json?_t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return result;

    const data = await res.json();
    const stadiumsObj = data?.programs?.stadiums;
    if (!stadiumsObj || typeof stadiumsObj !== 'object') return result;

    const nowJst = getCurrentJSTTime();

    for (const [stadiumKey, stadiumData] of Object.entries(stadiumsObj)) {
      const stadiumNumber = Number(stadiumKey);
      if (isNaN(stadiumNumber) || !STADIUM_MAP.has(stadiumNumber)) continue;
      const stadiumMeta = STADIUM_MAP.get(stadiumNumber)!;

      const racesObj = (stadiumData as { races?: Record<string, any> })?.races || {};
      const raceList: {
        raceNumber: number;
        closedAt: string;
        fullClosedAt: string;
        isFinished: boolean;
      }[] = [];

      for (let r = 1; r <= 12; r++) {
        const race = racesObj[String(r)] || racesObj[r];
        if (race) {
          const closedAtRaw = race.closed_at || '';
          let timeDisplay = '';
          if (closedAtRaw) {
            const timePart = closedAtRaw.split(' ')[1] || closedAtRaw;
            timeDisplay = timePart.slice(0, 5); // "10:45"
          }

          let isFinished = false;
          // Check if result has places populated or time has passed + 15 mins
          if (race.result && race.result.racers && race.result.racers['1']?.place_number) {
            isFinished = true;
          } else if (closedAtRaw) {
            const raceTime = new Date(closedAtRaw.replace(/-/g, '/'));
            if (!isNaN(raceTime.getTime()) && nowJst.getTime() > raceTime.getTime() + 15 * 60000) {
              isFinished = true;
            }
          }

          raceList.push({
            raceNumber: r,
            closedAt: timeDisplay,
            fullClosedAt: closedAtRaw,
            isFinished,
          });
        }
      }

      if (raceList.length > 0) {
        const isAllFinished = raceList.every((r) => r.isFinished);
        result.set(stadiumNumber, {
          stadiumNumber,
          stadiumName: stadiumMeta.name,
          races: raceList,
          isAllFinished,
        });
      }
    }
  } catch (err) {
    console.warn('fetchTodayOverview error:', err);
  }
  return result;
}

/**
 * Fetch holding stadiums and race schedules for any selected date
 */
export async function fetchDateOverview(dateStr: string): Promise<Map<number, TodayStadiumStatus>> {
  const todayStr = getTodayJST();
  if (dateStr === todayStr) {
    return fetchTodayOverview();
  }

  const result = new Map<number, TodayStadiumStatus>();
  try {
    const yyyy = dateStr.slice(0, 4);
    const yyyymmdd = dateStr.replace(/-/g, '');
    const progUrl = `https://boatraceopenapi.github.io/programs/v2/${yyyy}/${yyyymmdd}.json?_t=${Date.now()}`;
    const res = await fetch(progUrl, { cache: 'no-store' });
    if (!res.ok) return result;

    const data = await res.json();
    const programs: any[] = data.programs || [];
    if (!Array.isArray(programs) || programs.length === 0) return result;

    const nowJst = getCurrentJSTTime();
    const isPastDate = dateStr < todayStr;

    // Group races by stadium
    const stadiumRacesMap = new Map<number, any[]>();
    for (const p of programs) {
      const sNum = Number(p.race_stadium_number || p.stadium_number);
      if (isNaN(sNum) || !STADIUM_MAP.has(sNum)) continue;
      if (!stadiumRacesMap.has(sNum)) {
        stadiumRacesMap.set(sNum, []);
      }
      stadiumRacesMap.get(sNum)!.push(p);
    }

    for (const [stadiumNumber, progRaces] of stadiumRacesMap.entries()) {
      const stadiumMeta = STADIUM_MAP.get(stadiumNumber)!;
      progRaces.sort((a, b) => (a.race_number || 0) - (b.race_number || 0));

      const raceList = progRaces.map((r) => {
        const rNum = Number(r.race_number || r.number);
        const closedAtRaw = r.race_closed_at || r.closed_at || '';
        let timeDisplay = '';
        if (closedAtRaw) {
          const timePart = closedAtRaw.split(' ')[1] || closedAtRaw;
          timeDisplay = timePart.slice(0, 5);
        }

        let isFinished = isPastDate;
        if (!isPastDate && closedAtRaw) {
          const raceTime = new Date(closedAtRaw.replace(/-/g, '/'));
          if (!isNaN(raceTime.getTime()) && nowJst.getTime() > raceTime.getTime() + 15 * 60000) {
            isFinished = true;
          }
        }

        return {
          raceNumber: rNum,
          closedAt: timeDisplay,
          fullClosedAt: closedAtRaw,
          isFinished,
        };
      });

      if (raceList.length > 0) {
        const isAllFinished = raceList.every((r) => r.isFinished);
        result.set(stadiumNumber, {
          stadiumNumber,
          stadiumName: stadiumMeta.name,
          races: raceList,
          isAllFinished,
        });
      }
    }
  } catch (err) {
    console.warn('fetchDateOverview error:', err);
  }
  return result;
}

/**
 * Fetch race details with fallback chain:
 * 1. today.json (if date is today)
 * 2. programs/v2 and previews/v2
 * 3. boatrace.jp HTML parser fallback
 */
export async function fetchRaceData(
  dateStr: string, // YYYY-MM-DD
  stadiumNumber: number,
  raceNumber: number
): Promise<RaceInfo> {
  const stadiumMeta = STADIUM_MAP.get(stadiumNumber);
  const stadiumName = stadiumMeta ? stadiumMeta.name : `場${stadiumNumber}`;
  const todayStr = getTodayJST();
  const isToday = dateStr === todayStr;

  // 1. If today, try today.json first
  if (isToday) {
    try {
      const url = `https://boatraceopenapi.github.io/api/v1/today.json?_t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const stadiumObj = data?.programs?.stadiums?.[String(stadiumNumber)];
        const raceObj = stadiumObj?.races?.[String(raceNumber)];

        if (raceObj && raceObj.racers) {
          const parsed = parseTodayRaceObject(
            dateStr,
            stadiumNumber,
            stadiumName,
            raceNumber,
            raceObj
          );
          if (parsed && parsed.boats.length === 6) {
            // If preview data already has exhibition times, return directly!
            if (parsed.hasPreviewData) {
              return parsed;
            }
            // If preview wasn't in today.json, try previews/v2 or boatrace.jp for preview
            const previewData = await tryFetchPreviewsV2OrHtml(
              dateStr,
              stadiumNumber,
              raceNumber
            );
            if (previewData) {
              mergePreviewIntoRace(parsed, previewData);
            }
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('today.json fetch fallback:', e);
    }
  }

  // 2. Fallback to programs/v2
  try {
    const yyyy = dateStr.slice(0, 4);
    const yyyymmdd = dateStr.replace(/-/g, '');
    const progUrl = `https://boatraceopenapi.github.io/programs/v2/${yyyy}/${yyyymmdd}.json?_t=${Date.now()}`;
    const res = await fetch(progUrl, { cache: 'no-store' });
    if (res.ok) {
      const progData = await res.json();
      const programs = progData.programs || [];
      const matchRace = programs.find(
        (p: any) =>
          (p.race_stadium_number === stadiumNumber || p.stadium_number === stadiumNumber) &&
          (p.race_number === raceNumber || p.number === raceNumber)
      );

      if (matchRace && matchRace.boats && matchRace.boats.length >= 6) {
        const raceInfo = parseV2ProgramRace(
          dateStr,
          stadiumNumber,
          stadiumName,
          raceNumber,
          matchRace
        );

        // Fetch previews/v2
        const previewData = await tryFetchPreviewsV2OrHtml(
          dateStr,
          stadiumNumber,
          raceNumber
        );
        if (previewData) {
          mergePreviewIntoRace(raceInfo, previewData);
        }
        return raceInfo;
      }
    }
  } catch (e) {
    console.warn('programs/v2 fetch failed:', e);
  }

  // 3. Fallback to boatrace.jp HTML racelist & beforeinfo directly
  const htmlRace = await tryFetchFromBoatraceJpHtml(dateStr, stadiumNumber, raceNumber);
  if (htmlRace) {
    return htmlRace;
  }

  throw new Error(
    `指定された出走表が見つかりませんでした（日付: ${dateStr}、${stadiumName}、${raceNumber}R）。開催日やレース番号をご確認ください。`
  );
}

// -------------------------------------------------------------
// Parsers & Helpers
// -------------------------------------------------------------

function parseTodayRaceObject(
  dateStr: string,
  stadiumNumber: number,
  stadiumName: string,
  raceNumber: number,
  raceObj: any
): RaceInfo | null {
  const racersObj = raceObj.racers || {};
  const boats: BoatData[] = [];

  for (let b = 1; b <= 6; b++) {
    const r = racersObj[String(b)] || racersObj[b];
    if (!r) return null;

    let rankClass: 'A1' | 'A2' | 'B1' | 'B2' = 'B1';
    const rankSource = r.rank_number_source || '';
    if (rankSource.includes('A1')) rankClass = 'A1';
    else if (rankSource.includes('A2')) rankClass = 'A2';
    else if (rankSource.includes('B1')) rankClass = 'B1';
    else if (rankSource.includes('B2')) rankClass = 'B2';
    else if (r.rank_number === 1) rankClass = 'A1';
    else if (r.rank_number === 2) rankClass = 'A2';
    else if (r.rank_number === 3) rankClass = 'B1';
    else if (r.rank_number === 4) rankClass = 'B2';

    const branch = getBranchName(
      r.branch_number_source || r.branch_number,
      r.birthplace_number
    );

    boats.push({
      boatNumber: b,
      racerName: r.name || `選手${b}`,
      racerNumber: r.number,
      racerClass: rankClass,
      branchName: branch,
      nationalWinRate: Number(r.national_win_rate ?? 5.5),
      nationalTop2Percent: Number(r.national_top_2_percent ?? 35.0),
      nationalTop3Percent: Number(r.national_top_3_percent ?? 50.0),
      localWinRate: r.local_win_rate ? Number(r.local_win_rate) : undefined,
      localTop2Percent: Number(r.local_top_2_percent ?? 35.0),
      localTop3Percent: Number(r.local_top_3_percent ?? 50.0),
      motorTop2Percent: Number(r.motor_top_2_percent ?? 35.0),
      motorTop3Percent: r.motor_top_3_percent ? Number(r.motor_top_3_percent) : undefined,
      averageStartTiming: Number(r.average_start_timing ?? 0.16),
      exhibitionTime: null,
      startTiming: null,
      courseNumber: b,
      age: r.age,
      weight: r.weight,
    });
  }

  // Weather & Preview
  const preview = raceObj.preview;
  let hasPreview = false;
  const weather: WeatherData = {
    windSpeed: 0,
    windDirCode: null,
    waveHeight: 0,
  };

  if (preview) {
    if (preview.wind_speed !== null && preview.wind_speed !== undefined) {
      weather.windSpeed = Number(preview.wind_speed);
    }
    if (preview.wind_direction_number !== null && preview.wind_direction_number !== undefined) {
      weather.windDirCode = Number(preview.wind_direction_number);
    }
    if (preview.wave_height !== null && preview.wave_height !== undefined) {
      weather.waveHeight = Number(preview.wave_height);
    }
    if (preview.air_temperature !== null) {
      weather.temperature = Number(preview.air_temperature);
    }
    if (preview.water_temperature !== null) {
      weather.waterTemperature = Number(preview.water_temperature);
    }

    const prevRacers = preview.racers || {};
    let validExCount = 0;
    for (let b = 1; b <= 6; b++) {
      const pr = prevRacers[String(b)] || prevRacers[b];
      if (pr) {
        if (pr.exhibition_time) {
          boats[b - 1].exhibitionTime = Number(pr.exhibition_time);
          validExCount++;
        }
        if (pr.course_number) {
          boats[b - 1].courseNumber = Number(pr.course_number);
        }
        if (pr.start_timing !== null && pr.start_timing !== undefined) {
          boats[b - 1].startTiming = Number(pr.start_timing);
        }
      }
    }
    if (validExCount >= 6) {
      hasPreview = true;
    }
  }

  return {
    date: dateStr,
    stadiumNumber,
    stadiumName,
    raceNumber,
    raceTitle: raceObj.title || `${stadiumName} 第${raceNumber}レース`,
    raceSubtitle: raceObj.subtitle || '',
    closedAt: raceObj.closed_at || '',
    boats,
    weather,
    hasPreviewData: hasPreview,
  };
}

function parseV2ProgramRace(
  dateStr: string,
  stadiumNumber: number,
  stadiumName: string,
  raceNumber: number,
  matchRace: any
): RaceInfo {
  const boats: BoatData[] = matchRace.boats.map((b: any, index: number) => {
    let rankClass: 'A1' | 'A2' | 'B1' | 'B2' = 'B1';
    const cls = b.racer_class_number;
    if (cls === 1) rankClass = 'A1';
    else if (cls === 2) rankClass = 'A2';
    else if (cls === 3) rankClass = 'B1';
    else if (cls === 4) rankClass = 'B2';

    const branch = getBranchName(
      b.racer_branch_name || b.racer_branch_number,
      b.racer_birthplace_number
    );

    return {
      boatNumber: b.racer_boat_number || index + 1,
      racerName: b.racer_name || `選手${index + 1}`,
      racerNumber: b.racer_number,
      racerClass: rankClass,
      branchName: branch,
      nationalWinRate: Number(b.racer_national_top_1_percent ?? 5.5),
      nationalTop2Percent: Number(b.racer_national_top_2_percent ?? 35.0),
      nationalTop3Percent: Number(b.racer_national_top_3_percent ?? 50.0),
      localWinRate: b.racer_local_top_1_percent ? Number(b.racer_local_top_1_percent) : undefined,
      localTop2Percent: Number(b.racer_local_top_2_percent ?? 35.0),
      localTop3Percent: Number(b.racer_local_top_3_percent ?? 50.0),
      motorTop2Percent: Number(b.racer_assigned_motor_top_2_percent ?? 35.0),
      averageStartTiming: Number(b.racer_average_start_timing ?? 0.16),
      exhibitionTime: null,
      startTiming: null,
      courseNumber: b.racer_boat_number || index + 1,
      age: b.racer_age,
      weight: b.racer_weight,
    };
  });

  return {
    date: dateStr,
    stadiumNumber,
    stadiumName,
    raceNumber,
    raceTitle: matchRace.race_title || `${stadiumName} 第${raceNumber}レース`,
    raceSubtitle: matchRace.race_subtitle || '',
    closedAt: matchRace.race_closed_at || '',
    boats,
    weather: {
      windSpeed: 0,
      windDirCode: null,
      waveHeight: 0,
    },
    hasPreviewData: false,
  };
}

interface PreviewExtract {
  weather: WeatherData;
  boatPreviews: {
    boatNumber: number;
    courseNumber: number;
    exhibitionTime: number | null;
    startTiming: number | null;
  }[];
}

async function tryFetchPreviewsV2OrHtml(
  dateStr: string,
  stadiumNumber: number,
  raceNumber: number
): Promise<PreviewExtract | null> {
  const yyyy = dateStr.slice(0, 4);
  const yyyymmdd = dateStr.replace(/-/g, '');

  // 1. Try previews/v2
  try {
    const previewUrl = `https://boatraceopenapi.github.io/previews/v2/${yyyy}/${yyyymmdd}.json?_t=${Date.now()}`;
    const res = await fetch(previewUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const previews = data.previews || [];
      const match = previews.find(
        (p: any) =>
          (p.race_stadium_number === stadiumNumber || p.stadium_number === stadiumNumber) &&
          (p.race_number === raceNumber || p.number === raceNumber)
      );

      if (match && match.boats && match.boats.length >= 6) {
        const boatPreviews = match.boats.map((b: any, idx: number) => ({
          boatNumber: b.racer_boat_number || idx + 1,
          courseNumber: b.racer_course_number || idx + 1,
          exhibitionTime: b.racer_exhibition_time ? Number(b.racer_exhibition_time) : null,
          startTiming: b.racer_start_timing !== null && b.racer_start_timing !== undefined
            ? Number(b.racer_start_timing)
            : null,
        }));

        return {
          weather: {
            windSpeed: Number(match.race_wind ?? 0),
            windDirCode: match.race_wind_direction_number !== null && match.race_wind_direction_number !== undefined
              ? Number(match.race_wind_direction_number)
              : null,
            waveHeight: Number(match.race_wave ?? 0),
            temperature: match.race_temperature ? Number(match.race_temperature) : null,
            waterTemperature: match.race_water_temperature ? Number(match.race_water_temperature) : null,
          },
          boatPreviews,
        };
      }
    }
  } catch (e) {
    console.warn('previews/v2 fetch failed:', e);
  }

  // 2. Try boatrace.jp beforeinfo HTML parser
  try {
    const jcd = String(stadiumNumber).padStart(2, '0');
    const proxyUrls = [
      `/proxy/boatrace/owpc/pc/race/beforeinfo?rno=${raceNumber}&jcd=${jcd}&hd=${yyyymmdd}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://boatrace.jp/owpc/pc/race/beforeinfo?rno=${raceNumber}&jcd=${jcd}&hd=${yyyymmdd}`
      )}`,
    ];

    for (const url of proxyUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const html = await res.text();
          const parsed = parseBeforeinfoHtml(html);
          if (parsed && parsed.boatPreviews.length >= 6) {
            return parsed;
          }
        }
      } catch (err) {
        // try next proxy
      }
    }
  } catch (e) {
    console.warn('boatrace.jp preview HTML failed:', e);
  }

  return null;
}

function mergePreviewIntoRace(race: RaceInfo, preview: PreviewExtract) {
  race.weather = preview.weather;
  let validExCount = 0;

  for (const bp of preview.boatPreviews) {
    const boat = race.boats.find((b) => b.boatNumber === bp.boatNumber);
    if (boat) {
      if (bp.exhibitionTime !== null && bp.exhibitionTime > 0) {
        boat.exhibitionTime = bp.exhibitionTime;
        validExCount++;
      }
      if (bp.courseNumber) {
        boat.courseNumber = bp.courseNumber;
      }
      if (bp.startTiming !== null) {
        boat.startTiming = bp.startTiming;
      }
    }
  }

  if (validExCount >= 6) {
    race.hasPreviewData = true;
  }
}

function parseBeforeinfoHtml(html: string): PreviewExtract | null {
  try {
    // Extract wind speed, direction, wave height
    // Example: <span class="is-wind1"></span>, 風速 3m, 波高 2cm
    let windSpeed = 0;
    let windDirCode: number | null = null;
    let waveHeight = 0;

    const windMatch = html.match(/風速\s*(\d+)m/);
    if (windMatch) windSpeed = Number(windMatch[1]);

    const waveMatch = html.match(/波高\s*(\d+)cm/);
    if (waveMatch) waveHeight = Number(waveMatch[1]);

    const dirMatch = html.match(/is-wind(\d+)/);
    if (dirMatch) windDirCode = Number(dirMatch[1]);

    // Extract exhibition times
    // In boatrace.jp table: exhibition times are usually in tbody rows with class or <td>6.67</td>
    const exTimes: { boatNumber: number; exTime: number }[] = [];
    const exRegex = /<td>\s*(\d\.\d{2})\s*<\/td>/g;
    let m;
    let count = 0;
    while ((m = exRegex.exec(html)) !== null && count < 6) {
      count++;
      exTimes.push({ boatNumber: count, exTime: Number(m[1]) });
    }

    if (exTimes.length < 6) return null;

    const boatPreviews = exTimes.map((item) => ({
      boatNumber: item.boatNumber,
      courseNumber: item.boatNumber,
      exhibitionTime: item.exTime,
      startTiming: null,
    }));

    return {
      weather: {
        windSpeed,
        windDirCode,
        waveHeight,
      },
      boatPreviews,
    };
  } catch (err) {
    return null;
  }
}

async function tryFetchFromBoatraceJpHtml(
  dateStr: string,
  stadiumNumber: number,
  raceNumber: number
): Promise<RaceInfo | null> {
  // Direct racelist parser fallback if needed
  return null;
}
