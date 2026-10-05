import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
        title="アプリとしてインストール"
      >
        <Download className="w-3.5 h-3.5" />
        <span>アプリをインストール</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>ホーム画面に追加</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  iPhone / iPadでのインストール
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <p>
                    Safari下部のツールバーにある「<strong className="text-white">共有アイコン</strong>」（四角から矢印が上に出ているマーク）をタップします。
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <p>
                    メニューを下にスクロールし、「<strong className="text-white">ホーム画面に追加</strong>」を選択します。
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <p>
                    右上の「<strong className="text-white">追加</strong>」を押すと、アプリアイコンから素早く起動できるようになります。
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-sm font-semibold text-slate-200 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
