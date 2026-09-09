import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught mahjong app error:', error, errorInfo);
  }

  private handleResetAndReload = () => {
    try {
      localStorage.removeItem('mahjong_rules');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#071d12] text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#0d3320] border border-amber-500/60 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 mx-auto bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/40">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-amber-300">
                页面运行遇到了问题
              </h1>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                可能是手机本地缓存了旧版规则数据导致冲突。点击下方按钮可重置为推荐的马来西亚三人麻将标准规则并刷新。
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-black/40 border border-red-500/30 rounded-xl text-left text-[11px] text-red-300/90 font-mono break-all max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                重置规则并刷新 (Reset & Reload)
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                仅重新加载 (Reload Only)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
