import { GoogleGenAI, Type } from "@google/genai";
import { GeminiMoleculeInfo } from "../types";

// Initialize the client
// Note: The apiKey must be provided via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchMoleculeDetails = async (moleculeName: string): Promise<GeminiMoleculeInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide detailed chemical information for the molecule: ${moleculeName}.
      Focus on being accurate and educational.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "A concise 2-3 sentence description of what the molecule is and its classification.",
            },
            molecularFormula: {
              type: Type.STRING,
              description: "The chemical formula (e.g., C8H10N4O2).",
            },
            molarMass: {
              type: Type.STRING,
              description: "Molar mass with units (e.g., 194.19 g/mol).",
            },
            commonUses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-4 common applications or occurrences.",
            },
            safetyProfile: {
              type: Type.STRING,
              description: "A brief summary of safety/toxicity (e.g., Safe for consumption, Toxic if inhaled).",
            },
            funFact: {
              type: Type.STRING,
              description: "An interesting or surprising fact about this molecule.",
            },
          },
          required: ["description", "molecularFormula", "molarMass", "commonUses", "safetyProfile", "funFact"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GeminiMoleculeInfo;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Gemini Service Error:", error);
    // Return a fallback object to prevent UI crash
    return {
      description: "Could not retrieve AI insights for this molecule at this time.",
      molecularFormula: "Unknown",
      molarMass: "Unknown",
      commonUses: [],
      safetyProfile: "Unknown",
      funFact: "Try searching again later.",
    };
  }
};

export const suggestCorrectMoleculeName = async (originalQuery: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `The user searched for chemical compound "${originalQuery}" but it was not found in the database.
      Determine the correct standard chemical name or IUPAC name used in PubChem.
      It handles:
      1. Typos (e.g., "carbon di oxide" -> "Carbon Dioxide")
      2. Formulas (e.g., "C8H10N4O2" -> "Caffeine")
      3. Common names (e.g., "bleach" -> "Sodium Hypochlorite")
      
      Return ONLY the corrected name string. Do not add markdown.
      If the input is unrecognizable, return "null".`,
    });

    const text = response.text?.trim();
    if (!text || text.toLowerCase() === 'null') return null;
    // If Gemini returns the same thing, no correction needed (or possible)
    if (text.toLowerCase() === originalQuery.trim().toLowerCase()) return null;
    
    return text;
  } catch (error) {
    console.error("Gemini Correction Error:", error);
    return null;
  }
};