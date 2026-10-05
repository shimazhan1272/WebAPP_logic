import { StadiumMeta } from '../types/boatrace';

export const STADIUMS: StadiumMeta[] = [
  { number: 1, name: '桐生', prefecture: '群馬県', area: '関東' },
  { number: 2, name: '戸田', prefecture: '埼玉県', area: '関東' },
  { number: 3, name: '江戸川', prefecture: '東京都', area: '関東' },
  { number: 4, name: '平和島', prefecture: '東京都', area: '関東' },
  { number: 5, name: '多摩川', prefecture: '東京都', area: '関東' },
  { number: 6, name: '浜名湖', prefecture: '静岡県', area: '東海' },
  { number: 7, name: '蒲郡', prefecture: '愛知県', area: '東海' },
  { number: 8, name: '常滑', prefecture: '愛知県', area: '東海' },
  { number: 9, name: '津', prefecture: '三重県', area: '東海' },
  { number: 10, name: '三国', prefecture: '福井県', area: '近畿' },
  { number: 11, name: 'びわこ', prefecture: '滋賀県', area: '近畿' },
  { number: 12, name: '住之江', prefecture: '大阪府', area: '近畿' },
  { number: 13, name: '尼崎', prefecture: '兵庫県', area: '近畿' },
  { number: 14, name: '鳴門', prefecture: '徳島県', area: '四国' },
  { number: 15, name: '丸亀', prefecture: '香川県', area: '四国' },
  { number: 16, name: '児島', prefecture: '岡山県', area: '中国' },
  { number: 17, name: '宮島', prefecture: '広島県', area: '中国' },
  { number: 18, name: '徳山', prefecture: '山口県', area: '中国' },
  { number: 19, name: '下関', prefecture: '山口県', area: '中国' },
  { number: 20, name: '若松', prefecture: '福岡県', area: '九州' },
  { number: 21, name: '芦屋', prefecture: '福岡県', area: '九州' },
  { number: 22, name: '福岡', prefecture: '福岡県', area: '九州' },
  { number: 23, name: '唐津', prefecture: '佐賀県', area: '九州' },
  { number: 24, name: '大村', prefecture: '長崎県', area: '九州' },
];

export const STADIUM_MAP = new Map<number, StadiumMeta>(
  STADIUMS.map((s) => [s.number, s])
);

// Boat colors mapping for official 6 boats (1:白, 2:黒, 3:赤, 4:青, 5:黄, 6:緑)
export const BOAT_COLORS: Record<
  number,
  {
    bg: string;
    text: string;
    border: string;
    accent: string;
    label: string;
    hex: string;
  }
> = {
  1: {
    bg: 'bg-white',
    text: 'text-gray-900 font-bold',
    border: 'border-slate-300 shadow-sm',
    accent: '#ffffff',
    label: '白',
    hex: '#ffffff',
  },
  2: {
    bg: 'bg-zinc-900',
    text: 'text-white font-bold',
    border: 'border-zinc-700 shadow-sm',
    accent: '#18181b',
    label: '黒',
    hex: '#18181b',
  },
  3: {
    bg: 'bg-red-600',
    text: 'text-white font-bold',
    border: 'border-red-700 shadow-sm',
    accent: '#dc2626',
    label: '赤',
    hex: '#dc2626',
  },
  4: {
    bg: 'bg-blue-600',
    text: 'text-white font-bold',
    border: 'border-blue-700 shadow-sm',
    accent: '#2563eb',
    label: '青',
    hex: '#2563eb',
  },
  5: {
    bg: 'bg-amber-400',
    text: 'text-zinc-950 font-bold',
    border: 'border-amber-500 shadow-sm',
    accent: '#f59e0b',
    label: '黄',
    hex: '#f59e0b',
  },
  6: {
    bg: 'bg-emerald-600',
    text: 'text-white font-bold',
    border: 'border-emerald-700 shadow-sm',
    accent: '#059669',
    label: '緑',
    hex: '#059669',
  },
};

// Branch mapping fallback (Prefecture / Branch codes to Branch Name)
export const BRANCH_CODE_MAP: Record<number, string> = {
  1: '群馬',
  2: '埼玉',
  3: '東京',
  4: '静岡',
  5: '愛知',
  6: '三重',
  7: '福井',
  8: '滋賀',
  9: '大阪',
  10: '兵庫',
  11: '徳島',
  12: '香川',
  13: '岡山',
  14: '広島',
  15: '山口',
  16: '福岡',
  17: '佐賀',
  18: '長崎',
};

// Prefecture code to Branch Name fallback
export const PREFECTURE_TO_BRANCH: Record<number, string> = {
  1: '群馬', // 北海道 -> 東京/群馬
  10: '群馬',
  11: '埼玉',
  12: '千葉', // -> 東京
  13: '東京',
  14: '神奈川', // -> 東京
  22: '静岡',
  23: '愛知',
  24: '三重',
  18: '福井',
  25: '滋賀',
  27: '大阪',
  28: '兵庫',
  36: '徳島',
  37: '香川',
  33: '岡山',
  34: '広島',
  35: '山口',
  40: '福岡',
  41: '佐賀',
  42: '長崎',
};

export function getBranchName(branchRaw: unknown, prefRaw?: unknown): string {
  if (typeof branchRaw === 'string' && branchRaw.trim()) {
    return branchRaw.replace(/支部$/, '').trim();
  }
  const branchNum = Number(branchRaw);
  if (!isNaN(branchNum) && BRANCH_CODE_MAP[branchNum]) {
    return BRANCH_CODE_MAP[branchNum];
  }
  const prefNum = Number(prefRaw);
  if (!isNaN(prefNum) && PREFECTURE_TO_BRANCH[prefNum]) {
    return PREFECTURE_TO_BRANCH[prefNum];
  }
  return branchRaw ? String(branchRaw) : '−';
}

// Wind direction labels for codes 1..16, 17=無風
export const WIND_DIRECTION_LABELS: Record<number, string> = {
  1: '左横風 (1)',
  2: '左斜め追い風 (2)',
  3: '左斜め追い風 (3)',
  4: '追い風 (4)',
  5: '追い風 (5・真追い)',
  6: '追い風 (6)',
  7: '右斜め追い風 (7)',
  8: '右斜め追い風 (8)',
  9: '右横風 (9)',
  10: '右斜め向かい風 (10)',
  11: '右斜め向かい風 (11)',
  12: '向かい風 (12)',
  13: '向かい風 (13・真向かい)',
  14: '向かい風 (14)',
  15: '左斜め向かい風 (15)',
  16: '左斜め向かい風 (16)',
  17: '無風 (17)',
};
