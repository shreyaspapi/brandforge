import React from 'react';
import { GeneratedAsset } from '../types';
import { Download, ArrowUpRight } from 'lucide-react';
import saveAs from 'file-saver';

interface AssetGridProps {
  title: string;
  subtitle?: string;
  assets: GeneratedAsset[];
}

export const AssetGrid: React.FC<AssetGridProps> = ({ title, subtitle, assets }) => {
  const handleDownload = (asset: GeneratedAsset) => {
    saveAs(asset.imageUrl, `${asset.subtype}-${asset.id}.png`);
  };

  return (
    <div className="mb-24">
      <div className="flex items-end justify-between mb-10 border-b border-black/5 pb-6">
        <div>
          <h3 className="text-3xl font-semibold text-[#121212] tracking-tight mb-2">
            {title}
          </h3>
          {subtitle && <p className="text-black/50 text-sm max-w-md">{subtitle}</p>}
        </div>
        <span className="px-3 py-1 bg-black/5 rounded-full text-xs font-mono font-semibold text-black/40 uppercase tracking-widest">
          {assets.length} Generated
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 ring-1 ring-black/5">
            <div className={`relative ${asset.subtype === 'Billboard' ? 'aspect-video' : 'aspect-square'} bg-[#F8F9FA] flex items-center justify-center overflow-hidden`}>
               {/* Pattern Background for Logos */}
               {asset.type === 'logo' && (
                 <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
               )}
              
              <img
                src={asset.imageUrl}
                alt={asset.description}
                className={`w-full h-full ${asset.type === 'logo' ? 'object-contain p-12 mix-blend-multiply' : 'object-cover'} transition-transform duration-700 group-hover:scale-105 will-change-transform`}
              />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/5 backdrop-blur-[2px]">
                 <button 
                  onClick={() => handleDownload(asset)}
                  className="bg-white text-black px-6 py-3 rounded-full text-sm font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 hover:scale-105"
                 >
                   <Download size={16} />
                   <span>Download</span>
                 </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-black/5 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-[#121212] text-sm capitalize tracking-tight truncate max-w-[150px]">{asset.subtype}</h4>
                </div>
                <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-black/40 group-hover:bg-black group-hover:text-white transition-colors duration-300 cursor-pointer">
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};