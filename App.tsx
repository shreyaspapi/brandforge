import React, { useState, useEffect, useRef } from 'react';
import { UrlInput } from './components/UrlInput';
import { ColorPalette } from './components/ColorPalette';
import { AssetGrid } from './components/AssetGrid';
import { BrandStyle, GeneratedAsset, AnalysisState } from './types';
import { analyzeBrandFromUrl, generateLogoVariant, generateBrandAsset, getDemoBrandStyle } from './services/geminiService';
import { Box, Github, Sparkles, Zap, ArrowRight, Aperture, Key, Terminal, FastForward, AlertCircle, Maximize2 } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';

const LOGO_VARIANTS = [
  'Minimalist Wordmark',
  'Abstract Icon',
  'App Icon',
];

const BRAND_ASSETS = ['Billboard', 'Merch', 'Poster'] as const;

// Custom BrandForge Logo Component
const BrandLogo = () => (
  <div className="relative w-9 h-9 flex items-center justify-center bg-[#121212] rounded-xl shadow-xl shadow-black/10 overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-tr from-black to-gray-800"></div>
    <Aperture className="relative z-10 text-white animate-[spin_10s_linear_infinite]" size={20} strokeWidth={2.5} />
  </div>
);

export default function App() {
  const [hasKey, setHasKey] = useState(false);
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });
  const [brandStyle, setBrandStyle] = useState<BrandStyle | null>(null);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [progress, setProgress] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState<string>('');

  useEffect(() => {
    checkKey();
  }, []);

  useEffect(() => {
    // Auto-scroll logs
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const checkKey = async () => {
    try {
      if ((window as any).aistudio) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        // Fallback for local dev or environments without the injection wrapper
        setHasKey(true);
      }
    } catch (e) {
      console.error(e);
      setHasKey(true);
    }
  };

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`]);
  };

  const startGeneration = async (style: BrandStyle) => {
    setBrandStyle(style);
      
    setState({ status: 'generating' });
    setProgress(`Synthesizing brand identity for ${style.brandName}...`);
    addLog("Analysis complete. Starting asset generation...");
    
    const newAssets: GeneratedAsset[] = [];
    setAssets([]);

    // 1. Generate Primary Logo (Variant 1) immediately for the UI
    try {
       addLog("Generating primary logo...");
       const primaryLogo = await generateLogoVariant(style, LOGO_VARIANTS[0]);
       setAssets(prev => [...prev, primaryLogo]);
    } catch(e) {
      console.error("Primary logo failed", e);
    }

    // 2. Generate Brand Assets (Billboard, Merch, Poster)
    const assetPromises = BRAND_ASSETS.map(type => 
      generateBrandAsset(style, type)
        .then(asset => {
           addLog(`Generated ${type} asset.`);
           setAssets(prev => [...prev, asset]);
        })
        .catch(e => {
          console.error(`Failed to generate ${type}`, e);
          addLog(`Error generating ${type}: ${e.message}`);
        })
    );
    
    // 3. Generate remaining logos in background
    const extraLogoPromises = LOGO_VARIANTS.slice(1).map(variant => 
      generateLogoVariant(style, variant)
        .then(asset => {
          setAssets(prev => [...prev, asset]);
        })
    );

    await Promise.all([...assetPromises, ...extraLogoPromises]);
    
    setState({ status: 'complete' });
    setProgress('');
    addLog("All assets generated successfully.");
  };

  const handleAnalyze = async (url: string) => {
    try {
      setAnalyzedUrl(url);
      setState({ status: 'analyzing' });
      setProgress('Capturing site visuals & analyzing DNA with Gemini 3 Pro...');
      setLogs([]); // Clear previous logs
      addLog(`Starting analysis for: ${url}`);
      
      const style = await analyzeBrandFromUrl(url, addLog);
      await startGeneration(style);

    } catch (error) {
      console.error(error);
      setState({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred.' 
      });
      addLog(`FATAL ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDemoMode = async () => {
    setAnalyzedUrl('neonflux.io');
    setState({ status: 'analyzing' });
    setLogs([]);
    addLog("Demo Mode activated.");
    addLog("Skipping live analysis...");
    
    // Simulate a brief delay for UX
    setTimeout(async () => {
       const demoStyle = getDemoBrandStyle();
       addLog("Loaded 'NeonFlux' demo brand profile.");
       await startGeneration(demoStyle);
    }, 1000);
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

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
        <BrandLogo />
        <h1 className="text-3xl font-bold mt-6 mb-2 text-[#121212]">Welcome to BrandForge</h1>
        <p className="text-black/50 max-w-md mb-8">
          To access the high-fidelity generation capabilities of Gemini 3 Pro, please connect your API key.
        </p>
        <button 
          onClick={handleSelectKey}
          className="flex items-center gap-3 bg-[#121212] text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
        >
          <Key size={18} />
          <span>Connect API Key</span>
        </button>
        <div className="mt-8 text-xs text-black/30">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-black">
            Billing Information
          </a>
        </div>
      </div>
    );
  }

  // Find specific assets for the layout
  const primaryLogo = assets.find(a => a.type === 'logo'); // Use first logo
  const billboardAsset = assets.find(a => a.subtype === 'Billboard');
  const merchAsset = assets.find(a => a.subtype === 'Merch');
  const posterAsset = assets.find(a => a.subtype === 'Poster');

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#121212] font-sans overflow-x-hidden selection:bg-black selection:text-white pb-32">
      
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
          <div className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.reload()}>
            <BrandLogo />
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

      <main className="container mx-auto px-6 pt-40 relative z-10 max-w-7xl">
        
        {/* Intro / Input Section - Only show when NOT analyzing or complete */}
        {state.status === 'idle' && (
          <div className="max-w-4xl mx-auto text-center space-y-12 animate-in slide-in-from-bottom-5 fade-in duration-700">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 shadow-sm text-[11px] font-semibold tracking-wider text-black/60 uppercase">
              <Sparkles size={12} className="text-amber-500" />
              <span>Multimodal Vision Analysis</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter text-[#121212] mb-6 leading-[0.95]">
              Instant Brand <br />
              <span className="text-black/30 bg-clip-text text-transparent bg-gradient-to-r from-black/30 to-black/10">Architecture.</span>
            </h1>
            <div className="max-w-2xl mx-auto">
               <UrlInput onAnalyze={handleAnalyze} isLoading={false} />
            </div>
          </div>
        )}

        {/* Loading State */}
        {(state.status === 'analyzing' || state.status === 'generating') && (
          <div className="max-w-xl mx-auto text-center mt-20 animate-in fade-in zoom-in duration-500">
            <div className="relative w-full h-1 bg-black/5 rounded-full mb-8 overflow-hidden">
               <div className="absolute inset-y-0 left-0 bg-black w-1/3 animate-[shimmer_1.5s_infinite_linear] rounded-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, black, transparent)' }}></div>
            </div>
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="p-3 bg-white rounded-full shadow-lg shadow-black/5 ring-1 ring-black/5 animate-pulse">
                <Zap className="text-black fill-black" size={20} />
              </div>
              <p className="text-black/70 font-medium text-lg tracking-tight">{progress}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 w-full text-left shadow-2xl overflow-hidden ring-1 ring-white/10">
               <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10 text-white/40 text-xs uppercase tracking-widest font-mono">
                  <Terminal size={12} />
                  <span>System Logs</span>
               </div>
               <div className="font-mono text-[10px] md:text-xs text-green-400 space-y-1 h-32 overflow-y-auto custom-scrollbar">
                  {logs.map((log, i) => (
                    <div key={i} className="opacity-90">{log}</div>
                  ))}
                  <div ref={logsEndRef} />
               </div>
            </div>
            {state.status === 'analyzing' && (
               <button onClick={handleDemoMode} className="mt-6 text-xs text-black/40 hover:text-black underline decoration-dashed underline-offset-4 cursor-pointer transition-colors">
                 Stuck? Skip to Demo Result
               </button>
            )}
          </div>
        )}

        {/* ERROR STATE */}
        {state.status === 'error' && (
          <div className="max-w-xl mx-auto mt-20 p-6 rounded-xl border border-red-500/10 bg-red-50 text-center text-red-600 text-sm font-medium shadow-sm flex flex-col items-center gap-2">
            <AlertCircle size={24} className="mb-2 opacity-50"/>
            <span className="block font-bold uppercase tracking-wider text-xs">System Error</span>
            {state.message}
            <button onClick={handleDemoMode} className="mt-4 px-4 py-2 bg-white ring-1 ring-black/5 rounded-lg text-black text-xs font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2">
              <FastForward size={14} />
              Try Demo Instead
            </button>
          </div>
        )}

        {/* RESULTS: BRAND BOARD LAYOUT */}
        {brandStyle && (state.status === 'complete' || state.status === 'generating') && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 mt-10">
            
            {/* BRAND BOARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mb-24">
              
              {/* Left Column: Meta Info & Logo */}
              <div className="md:col-span-4 flex flex-col gap-6">
                
                {/* WEBSITE PILL */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-black/40 tracking-[0.2em] uppercase pl-1">Website</div>
                  <div 
                    className="inline-flex items-center px-5 py-2 rounded-full text-white font-medium text-sm shadow-md"
                    style={{ backgroundColor: brandStyle.dominantColors[0] || '#000' }}
                  >
                    {analyzedUrl || 'brand.com'}
                  </div>
                </div>

                {/* LOGO BOX */}
                <div className="space-y-2 flex-1 flex flex-col">
                  <div className="text-[10px] font-bold text-black/40 tracking-[0.2em] uppercase pl-1">Logo</div>
                  <div className="bg-white rounded-3xl ring-1 ring-black/5 shadow-sm flex items-center justify-center p-12 relative overflow-hidden group min-h-[300px] flex-1">
                     {primaryLogo ? (
                        <>
                          <img src={primaryLogo.imageUrl} alt="Primary Logo" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                          <button 
                             onClick={() => saveAs(primaryLogo.imageUrl, 'logo.png')}
                             className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black hover:text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Maximize2 size={16} />
                          </button>
                        </>
                     ) : (
                       <div className="animate-pulse w-24 h-24 rounded-full bg-black/5"></div>
                     )}
                  </div>
                </div>

              </div>

              {/* Right Column: Assets Gallery */}
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 
                 {/* Asset 1: Billboard (Full Width of Right Col) */}
                 <div className="md:col-span-2 space-y-2">
                     <div className="bg-black/5 rounded-3xl overflow-hidden aspect-video relative group ring-1 ring-black/5">
                        {billboardAsset ? (
                           <img src={billboardAsset.imageUrl} alt="Billboard" className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center bg-gray-100 text-black/20 animate-pulse">Generating Billboard...</div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                           <p className="font-bold tracking-wide">Brand Campaign</p>
                        </div>
                     </div>
                 </div>

                 {/* Asset 2: Merch (Half Width) */}
                 <div className="space-y-2">
                     <div className="bg-white rounded-3xl overflow-hidden aspect-[3/4] relative group ring-1 ring-black/5 shadow-sm">
                        {merchAsset ? (
                           <img src={merchAsset.imageUrl} alt="Merch" className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center bg-gray-100 text-black/20 animate-pulse">Designing Merch...</div>
                        )}
                     </div>
                 </div>

                 {/* Asset 3: Poster (Half Width) */}
                 <div className="space-y-2">
                     <div className="bg-black rounded-3xl overflow-hidden aspect-[9/16] relative group ring-1 ring-black/5 shadow-2xl">
                        {posterAsset ? (
                           <img src={posterAsset.imageUrl} alt="Poster" className="w-full h-full object-cover opacity-95" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white/20 animate-pulse">Rendering Poster...</div>
                        )}
                     </div>
                 </div>

              </div>
            </div>

            {/* Colors Section */}
            <ColorPalette colors={brandStyle.dominantColors} />

            {/* Additional Assets Grid (Hidden if only showcasing main items, or keep as "All Files") */}
            <div className="border-t border-black/5 pt-16">
              <AssetGrid 
                title="Asset Library" 
                subtitle="All generated assets available for download."
                assets={assets} 
              />
            </div>

            {/* Download Action */}
            <div className="flex flex-col items-center pb-20 pt-10">
              <button 
                onClick={handleDownloadZip}
                disabled={assets.length < 3}
                className="group relative flex items-center gap-5 bg-[#6D28D9] text-white px-10 py-5 rounded-2xl font-semibold text-lg transition-all hover:bg-[#5b21b6] hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Box size={22} strokeWidth={2} />
                <span className="tracking-tight">Download Brand Asset Kit</span>
                <span className="ml-2 p-1 bg-white/20 rounded-full group-hover:bg-white group-hover:text-purple-900 transition-colors">
                  <ArrowRight size={14} />
                </span>
              </button>
              <div className="mt-8 px-6 py-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm flex items-center gap-2">
                 <AlertCircle size={16} />
                 <span>Out of credits. Click Upgrade to continue generating.</span>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}