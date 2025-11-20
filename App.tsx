import React, { useState, useCallback } from 'react';
import { Search, Loader2, Github, Sparkles } from 'lucide-react';
import { MoleculeViewer } from './components/MoleculeViewer';
import { InfoPanel } from './components/InfoPanel';
import { searchPubChem } from './services/chemService';
import { fetchMoleculeDetails, suggestCorrectMoleculeName } from './services/geminiService';
import { SearchState } from './types';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [appState, setAppState] = useState<SearchState>({
    loading: false,
    error: null,
    molecule: null,
    info: null,
  });
  const [correctedFrom, setCorrectedFrom] = useState<string | null>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Prevent re-search if already loading
    if (appState.loading) return;

    setAppState(prev => ({ ...prev, loading: true, error: null, molecule: null, info: null }));
    setCorrectedFrom(null);

    try {
      // Parallel fetch for speed, but PubChem is required for visualization
      // 1. Get Structure (Critical) with smart fallback
      let moleculeData;
      try {
        moleculeData = await searchPubChem(searchQuery);
      } catch (err: any) {
        // If direct search fails, ask Gemini to correct the name (e.g. "carbon di oxide" -> "Carbon Dioxide")
        console.warn("Direct search failed, attempting AI correction...");
        const correctedName = await suggestCorrectMoleculeName(searchQuery);
        
        if (correctedName) {
          try {
            moleculeData = await searchPubChem(correctedName);
            setCorrectedFrom(searchQuery);
            // Optional: Update the search bar to the corrected name
            // setSearchQuery(correctedName); 
          } catch (retryErr) {
            // If corrected name also fails, throw original error
            throw err;
          }
        } else {
          throw err;
        }
      }
      
      setAppState(prev => ({ 
        ...prev, 
        molecule: moleculeData,
      }));

      // Now fetch Gemini Info using the molecule name from the successful PubChem result
      const infoData = await fetchMoleculeDetails(moleculeData.name);

      setAppState({
        loading: false,
        error: null,
        molecule: moleculeData,
        info: infoData,
      });

    } catch (err: any) {
      setAppState(prev => ({
        ...prev,
        loading: false,
        error: err.message || "An unexpected error occurred.",
      }));
    }
  }, [searchQuery, appState.loading]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-zinc-950 text-zinc-100 relative selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header / Navbar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            MolecuView <span className="font-light text-cyan-400">3D</span>
          </h1>
        </div>
        
        {/* Search Bar - Centralized */}
        <form onSubmit={handleSearch} className="absolute left-1/2 -translate-x-1/2 w-full max-w-md hidden md:block">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search molecule (e.g., Caffeine, Ethanol, ATP)" 
              className="w-full bg-zinc-900/50 border border-zinc-700 text-zinc-100 text-sm rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-sm group-hover:border-zinc-600 placeholder:text-zinc-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3.5 top-2.5 text-zinc-500 group-hover:text-zinc-400 transition-colors" size={16} />
            {appState.loading && (
              <Loader2 className="absolute right-3.5 top-2.5 text-cyan-500 animate-spin" size={16} />
            )}
          </div>
          {correctedFrom && !appState.loading && (
            <div className="absolute top-full left-0 mt-1 ml-4 flex items-center gap-1 text-xs text-emerald-400 animate-in slide-in-from-top-2">
              <Sparkles size={10} />
              <span>Auto-corrected from "{correctedFrom}"</span>
            </div>
          )}
        </form>

        <a href="#" className="text-zinc-500 hover:text-white transition-colors">
          <Github size={20} />
        </a>
      </header>

      {/* Mobile Search (Visible only on small screens) */}
      <div className="md:hidden p-4 border-b border-zinc-800 bg-zinc-900/30">
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            placeholder="Search molecule..." 
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-cyan-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
           <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
        </form>
      </div>

      {/* Main Content Grid */}
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden max-h-[calc(100vh-4rem)]">
        
        {/* Left: 3D Viewer (Larger Area) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-[400px] lg:min-h-0">
          <div className="flex-1 relative">
            <MoleculeViewer 
              data={appState.molecule} 
              loading={appState.loading && !appState.molecule} 
            />
            
            {/* Error Toast inside viewer area */}
            {appState.error && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-rose-500/10 border border-rose-500/50 text-rose-200 px-4 py-2 rounded-full text-sm shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                {appState.error}
              </div>
            )}
          </div>
        </div>

        {/* Right: Info Panel (Sidebar) */}
        <div className="lg:col-span-4 xl:col-span-3 bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
             <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Analysis</span>
             {appState.molecule && <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
          </div>
          <div className="flex-1 overflow-hidden relative">
            <InfoPanel 
              info={appState.info} 
              loading={appState.loading} 
              moleculeName={appState.molecule?.name}
            />
          </div>
          {/* Footer in sidebar */}
          <div className="p-3 text-center border-t border-zinc-800 bg-zinc-950/30">
             <p className="text-[10px] text-zinc-600">Data provided by PubChem & Gemini AI</p>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;