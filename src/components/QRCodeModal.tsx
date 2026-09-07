import React, { useState } from 'react';
import { QrCode, X, Copy, Check, Share2, Smartphone } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'zh' | 'en';
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 获取当前网站实际公网 URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://temporary-fast-slate-7e73jjw.vercel.app';
  // 使用高清稳定 QR 码生成服务
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}&bgcolor=ffffff&color=0e3a24&margin=2`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#14482e] to-[#0c2c1b] border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden text-center p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mahjong font-bold text-emerald-100 text-sm sm:text-base">
                {lang === 'zh' ? '手机扫码直接开' : 'Scan to Open on Phone'}
              </h3>
              <p className="text-[10px] text-emerald-400">
                {lang === 'zh' ? '牌友免输网址，相机对准即开' : 'Point camera to join immediately'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 text-emerald-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 二维码展示 */}
        <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-4 border-emerald-700/60 mx-auto">
          <img
            src={qrCodeUrl}
            alt="Mahjong App QR Code"
            className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain rounded-lg"
          />
        </div>

        {/* 提示文案 */}
        <div className="bg-[#0b2919] border border-emerald-800 rounded-xl p-2.5 text-xs text-emerald-300 space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-bold text-amber-300">
            <Smartphone className="w-4 h-4" />
            <span>{lang === 'zh' ? '使用微信 / 手机相机对准屏幕扫描' : 'Scan with phone camera'}</span>
          </div>
          <p className="text-[11px] text-emerald-400">
            {lang === 'zh'
              ? '支持 iPhone 与安卓，扫码打开后可“添加到主屏幕”秒变手机 App！'
              : 'Add to Home Screen after scanning for standalone app experience!'}
          </p>
        </div>

        {/* 复制网址按钮 */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-amber-300" />}
            <span>{copied ? (lang === 'zh' ? '已复制网址！' : 'Copied!') : (lang === 'zh' ? '复制网址发群' : 'Copy Link')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow transition"
          >
            {lang === 'zh' ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
