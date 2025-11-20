export interface MoleculeData {
  cid: number;
  name: string;
  sdf: string; // 3D Structure Data File content
}

export interface GeminiMoleculeInfo {
  description: string;
  molecularFormula: string;
  molarMass: string;
  commonUses: string[];
  safetyProfile: string;
  funFact: string;
}

export interface SearchState {
  loading: boolean;
  error: string | null;
  molecule: MoleculeData | null;
  info: GeminiMoleculeInfo | null;
}

export enum ViewStyle {
  BallAndStick = 'ball+stick',
  Spacefill = 'spacefill',
  Licorice = 'licorice',
  Cartoon = 'cartoon'
}