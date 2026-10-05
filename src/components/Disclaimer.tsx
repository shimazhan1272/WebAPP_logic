import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Disclaimer: React.FC = () => {
  return (
    <footer className="mt-8 border-t border-slate-800/80 pt-6 pb-12 text-slate-400 text-xs">
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500/80 shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed">
          <p className="font-bold text-slate-300">
            免責事項・注意事項
          </p>
          <p>
            統計モデルによる参考値です。係数は過去約26万レースから推定したもので、的中を保証するものではありません。回収率は控除率の水準で、期待値の高い買い目を示すものではありません。買い目点数は各券種0〜30点まで指定できます。馬券・舟券の購入は自己責任で。
          </p>
        </div>
      </div>
      <div className="mt-4 text-center text-slate-400 text-[11px]">
        &copy; {new Date().getFullYear()} ボートレースAI予想Webアプリ | Plackett-Luce 条件付きロジット統計モデル
      </div>
    </footer>
  );
};
