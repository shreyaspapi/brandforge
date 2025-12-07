import React, { useState } from 'react';
import { ArrowRight, Globe, Search } from 'lucide-react';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url);
    }
  };

  return (
    <div className="w-full relative z-20">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5 transition-all focus-within:ring-2 focus-within:ring-black/10 focus-within:shadow-[0_12px_40px_rgb(0,0,0,0.08)] p-2">
          <div className="pl-4 pr-2 text-black/30">
            <Globe size={22} strokeWidth={1.5} />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="enterwebsite.com"
            className="w-full bg-transparent border-none focus:ring-0 text-[#121212] placeholder-black/20 py-4 px-2 text-2xl font-light tracking-tight outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#121212] text-white hover:bg-black hover:scale-105 transition-all shadow-lg disabled:opacity-0 disabled:scale-90"
          >
             <ArrowRight size={22} />
          </button>
        </div>
      </form>
      <div className="mt-8 flex justify-center gap-8 text-[11px] uppercase tracking-widest text-black/30 font-bold">
        <span className="cursor-pointer hover:text-black transition-colors flex items-center gap-1.5" onClick={() => setUrl('stripe.com')}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> stripe.com
        </span>
        <span className="cursor-pointer hover:text-black transition-colors flex items-center gap-1.5" onClick={() => setUrl('linear.app')}>
           <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> linear.app
        </span>
        <span className="cursor-pointer hover:text-black transition-colors flex items-center gap-1.5" onClick={() => setUrl('vercel.com')}>
           <span className="w-1.5 h-1.5 rounded-full bg-black"></span> vercel.com
        </span>
      </div>
    </div>
  );
};