import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  Check,
  AlertCircle,
  Key,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { recognizeMahjongPhoto, RecognitionResult } from '../utils/aiVision';
import { MahjongTileData, Meld } from '../types/mahjong';
import { MahjongTile } from './MahjongTile';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRecognizedHand: (hand: MahjongTileData[], melds: Meld[], flowers: MahjongTileData[]) => void;
  lang: 'zh' | 'en';
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  isOpen,
  onClose,
  onApplyRecognizedHand,
  lang,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_mahjong_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    localStorage.setItem('gemini_mahjong_api_key', val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      triggerRecognition(base64);
    };
    reader.readAsDataURL(file);
  };

  const triggerRecognition = async (imageBase64: string) => {
    setIsScanning(true);
    setResult(null);
    try {
      const res = await recognizeMahjongPhoto(imageBase64, apiKey);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  // 快速使用预设照片体验
  const handleUsePreset = (presetIndex: number) => {
    // 模拟一张简易的麻将手牌图
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#175635';
      ctx.fillRect(0, 0, 600, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🀄 马来西亚三人麻将实拍牌桌模拟', 300, 150);
    }
    const sampleBase64 = canvas.toDataURL('image/jpeg');
    setSelectedImage(sampleBase64);
    triggerRecognition(sampleBase64);
  };

  const handleApply = () => {
    if (!result) return;
    onApplyRecognizedHand(result.handTiles, result.melds, result.flowerTiles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#14482e] to-[#0c2c1b] border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 border-b border-emerald-700/60 p-4 text-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-mahjong font-bold text-base sm:text-lg">
                {lang === 'zh' ? '手机拍照识牌 (AI 识牌)' : 'Camera & Photo Tile Scanner'}
              </h2>
              <p className="text-[11px] text-emerald-300">
                {lang === 'zh' ? '拍下手牌，自动录入筒子、飞牌与花牌' : 'Snap your hand for instant fan calculation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-emerald-300 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 主体 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-100 flex-1 text-xs">
          {/* 拍照 / 上传触发区 */}
          {!selectedImage ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-600/80 hover:border-amber-400/80 bg-emerald-950/50 hover:bg-emerald-950/80 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shadow-lg">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <span className="font-bold text-sm text-emerald-100 block">
                    {lang === 'zh' ? '点击调起手机相机拍照 或 选取相册照片' : 'Tap to take photo or upload'}
                  </span>
                  <span className="text-emerald-400 text-xs mt-1 block">
                    {lang === 'zh' ? '支持清晰对准 13 或 14 张手牌' : 'Ensure all tiles are visible in one frame'}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* 快捷测试按钮 */}
              <div className="bg-[#0b2919] border border-emerald-800/80 rounded-2xl p-3 text-center space-y-2">
                <span className="text-emerald-300 font-medium block">
                  {lang === 'zh' ? '没有麻将在手边？试试预设实战照片演示：' : 'No tiles nearby? Try a demo hand:'}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUsePreset(1)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border border-emerald-700 font-bold transition"
                  >
                    🀄 {lang === 'zh' ? '实战范例：猫吃老鼠高番手牌' : 'Demo 1: Cat-Rat Bite Hand'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUsePreset(2)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border border-emerald-700 font-bold transition"
                  >
                    ✨ {lang === 'zh' ? '实战范例：副露碰一筒手牌' : 'Demo 2: Pong Hand'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 预览图 */}
              <div className="relative rounded-2xl overflow-hidden border border-emerald-700 bg-black/40 max-h-48 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Scanned Tiles"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setResult(null);
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'zh' ? '重拍' : 'Retake'}</span>
                </button>
              </div>

              {/* 识别状态指示 */}
              {isScanning && (
                <div className="p-5 text-center bg-emerald-950/80 border border-emerald-700 rounded-2xl space-y-2 animate-pulse">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-spin" />
                  <div className="font-bold text-emerald-200 text-sm">
                    {lang === 'zh' ? 'AI 正在智能识别麻将手牌...' : 'AI is recognizing your Mahjong tiles...'}
                  </div>
                  <p className="text-emerald-400 text-xs">
                    {lang === 'zh' ? '正在匹配筒子、风牌、红中发财与猫鼠花牌...' : 'Matching Dots, Jokers, and Animals...'}
                  </p>
                </div>
              )}

              {/* 识别结果展示与微调 */}
              {result && (
                <div className="space-y-3 bg-[#0b2919] border border-emerald-800 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      {lang === 'zh' ? 'AI 识别结果（支持一键核对导入）：' : 'Recognized Tiles:'}
                    </span>
                    <span className="text-[11px] text-emerald-400">
                      {result.handTiles.length} {lang === 'zh' ? '张手牌' : 'tiles'}
                    </span>
                  </div>

                  {/* 识别出的手牌 */}
                  <div>
                    <span className="text-[11px] text-emerald-400 block mb-1">
                      {lang === 'zh' ? '立牌与飞牌：' : 'In-hand Tiles:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-emerald-950/60 rounded-xl">
                      {result.handTiles.map((t, idx) => (
                        <MahjongTile key={idx} tile={t} size="sm" />
                      ))}
                    </div>
                  </div>

                  {/* 识别出的副露 */}
                  {result.melds.length > 0 && (
                    <div>
                      <span className="text-[11px] text-emerald-400 block mb-1">
                        {lang === 'zh' ? '副露碰杠：' : 'Melds:'}
                      </span>
                      <div className="flex flex-wrap gap-2 p-2 bg-emerald-950/60 rounded-xl">
                        {result.melds.map((m, idx) => (
                          <div key={idx} className="flex gap-0.5 border border-emerald-700/60 rounded p-1">
                            {m.tiles.map((t, i) => (
                              <MahjongTile key={i} tile={t} size="xs" />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 识别出的花与动物 */}
                  {result.flowerTiles.length > 0 && (
                    <div>
                      <span className="text-[11px] text-emerald-400 block mb-1">
                        {lang === 'zh' ? '花牌与动物：' : 'Flowers & Animals:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-emerald-950/60 rounded-xl">
                        {result.flowerTiles.map((t, idx) => (
                          <MahjongTile key={idx} tile={t} size="sm" />
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-emerald-300/80 italic">
                    “{result.rawSummary}”
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 可选 Gemini API Key 设置折叠区 */}
          <div className="border-t border-emerald-800/80 pt-2">
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-emerald-400 hover:text-emerald-200 flex items-center gap-1 text-[11px]"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'zh' ? '配置云端 Gemini API Key (可选)' : 'Configure Gemini API Key (Optional)'}</span>
            </button>

            {showKeyInput && (
              <div className="mt-2 bg-emerald-950/70 border border-emerald-800 rounded-xl p-3 space-y-2">
                <p className="text-[11px] text-emerald-300">
                  {lang === 'zh'
                    ? '填入您的 Google Gemini API Key 后，将直接调用 Gemini 2.5 Flash 视觉大模型识别真实拍照照片。未配置时将使用离线模拟助手。'
                    : 'Add your Gemini API Key to enable cloud vision recognition.'}
                </p>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="w-full bg-[#0c2e1c] border border-emerald-700 rounded-xl px-3 py-1.5 text-emerald-100 text-xs focus:ring-1 focus:ring-amber-400 outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* 底部确认按钮 */}
        <div className="p-3 bg-[#0a2416] border-t border-emerald-800/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-bold transition"
          >
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={!result}
            onClick={handleApply}
            className={`
              flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition
              ${
                result
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer'
                  : 'bg-emerald-950 text-emerald-600 cursor-not-allowed border border-emerald-800'
              }
            `}
          >
            <Check className="w-4 h-4" />
            <span>{lang === 'zh' ? '将识别牌面导入桌面' : 'Apply to Table'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
