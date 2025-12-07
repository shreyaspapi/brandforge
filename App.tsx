import React, { useState } from 'react';
import { UrlInput } from './components/UrlInput';
import { ColorPalette } from './components/ColorPalette';
import { AssetGrid } from './components/AssetGrid';
import { BrandStyle, GeneratedAsset, AnalysisState } from './types';
import { analyzeBrandFromUrl, generateLogoVariant, generateSocialMock } from './services/geminiService';
import { Layers, Command, Box, Github, Code2, Sparkles, Zap, ArrowRight } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';

const LOGO_VARIANTS = [
  'Minimalist Wordmark',
  'Abstract Icon',
  'Geometric Monogram',
  'App Icon',
  'Emblem'
];

const SOCIAL_PLATFORMS = ['Instagram', 'Twitter', 'LinkedIn'] as const;

export default function App() {
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });
  const [brandStyle, setBrandStyle] = useState<BrandStyle | null>(null);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [progress, setProgress] = useState<string>('');

  const handleAnalyze = async (url: string) => {
    try {
      setState({ status: 'analyzing' });
      setProgress('Initializing visual analysis...');
      
      const style = await analyzeBrandFromUrl(url);
      setBrandStyle(style);
      
      setState({ status: 'generating' });
      setProgress(`Extracting DNA from ${style.brandName}...`);
      
      const newAssets: GeneratedAsset[] = [];
      setAssets([]);

      // Generate Logos in parallel
      const logoPromises = LOGO_VARIANTS.map(variant => 
        generateLogoVariant(style, variant)
          .then(asset => {
             newAssets.push(asset);
             setAssets(prev => [...prev, asset]); // Incremental update
          })
          .catch(e => console.error(`Failed to generate ${variant} logo`, e))
      );

      // Generate Socials in parallel
      const socialPromises = SOCIAL_PLATFORMS.map(platform =>
        generateSocialMock(style, platform)
          .then(asset => {
            newAssets.push(asset);
            setAssets(prev => [...prev, asset]); // Incremental update
          })
          .catch(e => console.error(`Failed to generate ${platform} mock`, e))
      );

      await Promise.all([...logoPromises, ...socialPromises]);
      
      setState({ status: 'complete' });
      setProgress('');

    } catch (error) {
      console.error(error);
      setState({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred.' 
      });
    }
  };

  const handleDownloadZip = async () => {
    if (!brandStyle || assets.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder(brandStyle.brandName.replace(/\s+/g, '_') + '_BrandKit');
    
    if (!folder) return;

    // Add Style Guide
    const styleGuide = {
      name: brandStyle.brandName,
      theme: brandStyle.themeDescription,
      colors: brandStyle.dominantColors,
      fonts: brandStyle.fontStyle,
      layout: brandStyle.layoutVibe,
      generatedAt: new Date().toISOString()
    };
    folder.file('style-guide.json', JSON.stringify(styleGuide, null, 2));

    // Add Images
    for (const asset of assets) {
      try {
        const response = await fetch(asset.imageUrl);
        const blob = await response.blob();
        folder.file(`${asset.type}s/${asset.subtype.replace(/\s+/g, '_')}.png`, blob);
      } catch (e) {
        console.error("Failed to add file to zip", e);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${brandStyle.brandName}_BrandKit.zip`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#121212] font-sans overflow-x-hidden">
      
      {/* Subtle Noise Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.4] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Modern Gradient Mesh Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-100/40 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-100/40 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 bg-[#121212] text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-black/5">
              B
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#121212]">BrandForge</span>
          </div>
          <div className="flex items-center gap-8">
             <a href="#" className="hidden md:block text-xs font-medium text-black/50 hover:text-black transition-colors uppercase tracking-widest">
               Methodology
            </a>
             <a href="#" className="p-2 text-black/60 hover:text-black transition-colors bg-black/5 rounded-full hover:bg-black/10">
              <Github size={18} />
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-40 pb-20 relative z-10 max-w-5xl">
        
        {/* Hero */}
        <div className="text-center mb-24 space-y-8 animate-in slide-in-from-bottom-5 fade-in duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 shadow-sm text-[11px] font-semibold tracking-wider text-black/60 uppercase">
            <Sparkles size={12} className="text-amber-500" />
            <span>Generative Design System</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter text-[#121212] mb-6 leading-[0.95]">
            Instant Brand <br />
            <span className="text-black/30 bg-clip-text text-transparent bg-gradient-to-r from-black/30 to-black/10">Architecture.</span>
          </h1>
          <p className="text-black/50 text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-normal">
            Input a URL. We distill the visual essence and synthesize a complete, production-ready brand identity kit.
          </p>
        </div>

        {/* Input */}
        <div className="max-w-2xl mx-auto mb-32 relative">
           {/* Decorative elements around input */}
           <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-orange-200 to-amber-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
           <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-bl from-blue-200 to-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
           
          <UrlInput onAnalyze={handleAnalyze} isLoading={state.status === 'analyzing' || state.status === 'generating'} />
        </div>

        {/* Loading State */}
        {(state.status === 'analyzing' || state.status === 'generating') && (
          <div className="max-w-xl mx-auto text-center mb-24 animate-in fade-in zoom-in duration-500">
            <div className="relative w-full h-1 bg-black/5 rounded-full mb-8 overflow-hidden">
               <div className="absolute inset-y-0 left-0 bg-black w-1/3 animate-[shimmer_1.5s_infinite_linear] rounded-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, black, transparent)' }}></div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-lg shadow-black/5 ring-1 ring-black/5 animate-pulse">
                <Zap className="text-black fill-black" size={20} />
              </div>
              <p className="text-black/70 font-medium text-lg tracking-tight">{progress}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="max-w-xl mx-auto p-6 rounded-xl border border-red-500/10 bg-red-50 text-center text-red-600 text-sm font-medium mb-20 shadow-sm">
            <span className="block font-bold mb-1 uppercase tracking-wider text-xs">System Error</span>
            {state.message}
          </div>
        )}

        {/* Results */}
        {brandStyle && (
          <div className="space-y-32 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            
            {/* Brand Manifesto */}
            <div className="relative">
              <div className="absolute -left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-black to-transparent opacity-10 rounded-full"></div>
              <div className="pl-10 grid grid-cols-1 md:grid-cols-2 gap-12 pb-12">
                 <div>
                    <h2 className="text-7xl font-bold text-[#121212] tracking-tighter mb-6">{brandStyle.brandName}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-4 py-1.5 bg-black text-white rounded-full text-xs font-bold tracking-wide shadow-lg shadow-black/20">{brandStyle.fontStyle}</span>
                      <span className="px-4 py-1.5 bg-white border border-black/10 rounded-full text-xs font-semibold text-black/60 tracking-wide">{brandStyle.layoutVibe}</span>
                    </div>
                 </div>
                 <div className="flex flex-col justify-end">
                   <p className="text-2xl text-black/70 font-medium leading-snug tracking-tight">
                     "{brandStyle.themeDescription}"
                   </p>
                 </div>
              </div>
            </div>

            {/* Colors */}
            <ColorPalette colors={brandStyle.dominantColors} />

            {/* Assets */}
            <AssetGrid 
              title="Identity Marks" 
              subtitle="Vector-optimized logo concepts derived from brand DNA."
              assets={assets.filter(a => a.type === 'logo')} 
            />

            <AssetGrid 
              title="Social Collateral" 
              subtitle="High-engagement templates adapted for platform specifications."
              assets={assets.filter(a => a.type === 'social')} 
            />

            {/* Download Action */}
            <div className="flex flex-col items-center pb-32 pt-12">
              <button 
                onClick={handleDownloadZip}
                disabled={state.status !== 'complete'}
                className="group relative flex items-center gap-5 bg-[#121212] text-white px-10 py-5 rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Box size={22} strokeWidth={2} />
                <span className="tracking-tight">Download Brand Asset Kit</span>
                <span className="ml-2 p-1 bg-white/20 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                  <ArrowRight size={14} />
                </span>
              </button>
              <p className="mt-8 text-black/30 text-[10px] font-bold tracking-[0.2em] uppercase">
                Powered by Gemini Vision 2.5
              </p>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}