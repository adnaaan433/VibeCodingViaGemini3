import React, { useEffect, useRef, useState } from 'react';
import * as NGL from 'ngl';
import { MoleculeData, ViewStyle } from '../types';
import { Maximize2, Minimize2, Settings2 } from 'lucide-react';

interface MoleculeViewerProps {
  data: MoleculeData | null;
  loading: boolean;
}

export const MoleculeViewer: React.FC<MoleculeViewerProps> = ({ data, loading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<NGL.Stage | null>(null);
  const [viewStyle, setViewStyle] = useState<ViewStyle>(ViewStyle.BallAndStick);
  const [spin, setSpin] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Stage
  useEffect(() => {
    if (!containerRef.current) return;

    const stage = new NGL.Stage(containerRef.current, {
      backgroundColor: '#09090b', // Zinc 950
      tooltip: true,
    });
    
    stageRef.current = stage;

    const handleResize = () => stage.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Clean up stage is tricky in NGL without disposing context, usually safe to leave if component unmounts rarely
      // but let's try to clear
      stage.removeAllComponents();
    };
  }, []);

  // Load Data
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !data) return;

    stage.removeAllComponents();
    
    // Load the SDF string
    const stringBlob = new Blob([data.sdf], { type: 'text/plain' });
    
    stage.loadFile(stringBlob, { ext: 'sdf', defaultRepresentation: false })
      .then((component) => {
        if (!component) return;

        // Apply representation
        component.addRepresentation(viewStyle === ViewStyle.BallAndStick ? 'ball+stick' : viewStyle, {
            sele: '*', 
            colorScheme: 'element',
            aspectRatio: viewStyle === 'licorice' ? 1.0 : undefined 
        });
        
        component.autoView();
        
        // Reset spin if enabled
        if (spin) {
             stage.setSpin(true);
        }
      })
      .catch((err) => console.error("NGL Load Error:", err));

  }, [data, viewStyle]);

  // Handle Spin Toggle
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.setSpin(spin);
    }
  }, [spin]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };
  
  // Monitor fullscreen change from ESC key
  useEffect(() => {
      const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', onFSChange);
      return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  return (
    <div className="relative w-full h-full group bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
      {/* Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm transition-all duration-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p className="mt-4 text-cyan-500 font-mono text-sm animate-pulse">Synthesizing 3D Model...</p>
        </div>
      )}

      {/* Placeholder/Empty State */}
      {!data && !loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none opacity-40">
          <div className="w-32 h-32 border-4 border-zinc-700 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">⚛️</span>
          </div>
          <p className="text-zinc-500 font-light">Ready to visualize</p>
        </div>
      )}

      {/* Controls Overlay - Only visible when data exists */}
      {data && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md rounded-full border border-zinc-700 shadow-lg transition-opacity opacity-0 group-hover:opacity-100">
          {/* Style Selector */}
          <div className="relative group/menu">
            <button 
              className="p-2 hover:bg-zinc-700 rounded-full text-zinc-300 transition-colors"
              title="Visualization Style"
            >
               <Settings2 size={20} />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/menu:flex flex-col gap-1 p-1 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 min-w-[120px]">
              {(Object.values(ViewStyle) as ViewStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => setViewStyle(style)}
                  className={`px-3 py-1.5 text-xs text-left rounded-md capitalize transition-colors ${
                    viewStyle === style 
                      ? 'bg-cyan-500/20 text-cyan-400 font-medium' 
                      : 'hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {style.replace('+', ' & ')}
                </button>
              ))}
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          {/* Spin Toggle */}
          <button
            onClick={() => setSpin(!spin)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              spin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {spin ? 'Spinning' : 'Pause'}
          </button>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          {/* Fullscreen */}
          <button 
            onClick={toggleFullscreen}
            className="p-2 hover:bg-zinc-700 rounded-full text-zinc-300 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      )}
    </div>
  );
};