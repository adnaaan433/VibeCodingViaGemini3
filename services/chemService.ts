import { MoleculeData } from '../types';

const PUBCHEM_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

export const searchPubChem = async (query: string): Promise<MoleculeData> => {
  try {
    const trimmedQuery = query.trim();
    // 1. Search for the compound name to get the CID (Compound ID)
    const searchUrl = `${PUBCHEM_BASE}/compound/name/${encodeURIComponent(trimmedQuery)}/JSON`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      if (searchRes.status === 404) {
        throw new Error(`Molecule "${trimmedQuery}" not found in PubChem database.`);
      }
      throw new Error('Failed to communicate with PubChem.');
    }

    const searchJson = await searchRes.json();
    const cid = searchJson.PC_Compounds?.[0]?.id?.id?.cid;

    if (!cid) {
      throw new Error('No CID found for this molecule.');
    }

    // 2. Fetch the 3D SDF (Structure Data File)
    // record_type=3d is crucial for 3D coordinates.
    const sdfUrl = `${PUBCHEM_BASE}/compound/cid/${cid}/SDF?record_type=3d`;
    const sdfRes = await fetch(sdfUrl);

    if (!sdfRes.ok) {
      // Fallback to 2D if 3D is not available, though less ideal for viewer
      const sdf2dUrl = `${PUBCHEM_BASE}/compound/cid/${cid}/SDF`;
      const sdf2dRes = await fetch(sdf2dUrl);
      if (!sdf2dRes.ok) throw new Error('Failed to fetch structure data.');
      
      const sdf2dText = await sdf2dRes.text();
       return {
        cid,
        name: trimmedQuery,
        sdf: sdf2dText,
      };
    }

    const sdfText = await sdfRes.text();

    return {
      cid,
      name: trimmedQuery,
      sdf: sdfText,
    };

  } catch (error: any) {
    console.error("PubChem API Error:", error);
    throw error;
  }
};