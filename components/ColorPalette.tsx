import React, { useMemo } from 'react';
import { analyzeColor } from '../utils/colorUtils';
import { Copy, Check, Droplet } from 'lucide-react';

interface ColorPaletteProps {
  colors: string[];
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ colors }) => {
  const analyzedColors = useMemo(() => colors.map(analyzeColor), [colors]);
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="mb-24">
      <div className="flex items-end justify-between mb-8 border-b border-black/5 pb-6">
        <div>
          <h3 className="text-3xl font-semibold text-[#121212] tracking-tight flex items-center gap-3">
             Chromatic System
          </h3>
        </div>
        <span className="text-xs font-mono text-black/30 uppercase tracking-widest bg-black/5 px-2 py-1 rounded">
          {colors.length} Swatches
        </span>
      </div>
      
      <div className="flex flex-col md:flex-row w-full rounded-2xl overflow-hidden ring-1 ring-black/10 shadow-xl shadow-black/5 h-auto md:h-64">
        {analyzedColors.map((color) => (
          <div 
            key={color.hex} 
            className="flex-1 min-h-[100px] md:min-h-full relative group cursor-pointer transition-all duration-500 hover:flex-[1.5]"
            style={{ backgroundColor: color.hex }}
            onClick={() => copyToClipboard(color.hex)}
          >
            <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div className="flex justify-between items-end backdrop-blur-md bg-white/10 p-3 rounded-xl ring-1 ring-white/20 shadow-lg">
                 <div>
                    <p className={`font-mono text-sm font-bold uppercase tracking-wider mb-1 ${color.contrastBlack > 10 ? 'text-black' : 'text-white'}`}>
                      {color.hex}
                    </p>
                    <div className="flex gap-2">
                       <span className={`text-[10px] px-2 py-0.5 rounded-full ${color.accessibility === 'Fail' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'} font-bold shadow-sm`}>
                         {color.accessibility}
                       </span>
                    </div>
                 </div>
                 <div className="bg-white text-black w-8 h-8 flex items-center justify-center rounded-full shadow-md">
                    {copied === color.hex ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
         {analyzedColors.map((color) => (
           <div key={`meta-${color.hex}`} className="bg-white border border-black/5 px-3 py-2 rounded-lg flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-4 h-4 rounded-full ring-1 ring-black/5 shadow-inner" style={{ background: color.hex }}></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-black/80 font-mono leading-none">{color.hex}</span>
                <span className="text-[9px] text-black/40 font-semibold uppercase tracking-wide mt-1">Contrast: {Math.max(color.contrastBlack, color.contrastWhite)}:1</span>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};