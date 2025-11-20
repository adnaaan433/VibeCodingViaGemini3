import React from 'react';
import { GeminiMoleculeInfo } from '../types';
import { Info, ShieldAlert, FlaskConical, Tag, Atom } from 'lucide-react';

interface InfoPanelProps {
  info: GeminiMoleculeInfo | null;
  loading: boolean;
  moleculeName: string | undefined;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ info, loading, moleculeName }) => {
  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4 p-6 animate-pulse">
        <div className="h-8 w-2/3 bg-zinc-800 rounded mb-4"></div>
        <div className="h-4 w-full bg-zinc-800 rounded"></div>
        <div className="h-4 w-full bg-zinc-800 rounded"></div>
        <div className="h-4 w-5/6 bg-zinc-800 rounded mb-6"></div>
        <div className="h-32 w-full bg-zinc-800 rounded-xl"></div>
        <div className="h-20 w-full bg-zinc-800 rounded-xl mt-auto"></div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center text-zinc-500">
        <FlaskConical size={48} className="mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-zinc-400 mb-2">Molecular Insights</h3>
        <p className="text-sm max-w-[250px]">Search for a molecule to unlock detailed chemical properties and safety information powered by Gemini AI.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 custom-scrollbar">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight capitalize mb-1">
          {moleculeName || "Unknown Molecule"}
        </h2>
        <div className="flex flex-wrap gap-2 mt-2">
           <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
             <Atom size={12} /> {info.molecularFormula}
           </span>
           <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
             {info.molarMass}
           </span>
        </div>
      </div>

      {/* Description */}
      <div className="prose prose-invert prose-sm leading-relaxed text-zinc-300">
        <p>{info.description}</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        
        {/* Uses */}
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-cyan-400 mb-3">
            <Tag size={16} /> Common Applications
          </h4>
          <ul className="space-y-2">
            {info.commonUses.map((use, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500/50 shrink-0"></span>
                {use}
              </li>
            ))}
          </ul>
        </div>

        {/* Safety */}
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
           <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-400 mb-3">
            <ShieldAlert size={16} /> Safety Profile
          </h4>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {info.safetyProfile}
          </p>
        </div>

         {/* Fun Fact */}
         <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-xl p-4 border border-amber-500/10">
           <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-400 mb-2">
            <Info size={16} /> Did you know?
          </h4>
          <p className="text-sm text-zinc-300 italic">
            "{info.funFact}"
          </p>
        </div>
      </div>
    </div>
  );
};