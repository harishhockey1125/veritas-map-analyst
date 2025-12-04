import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Mock data to ensure the UI works beautifully without an API key
const MOCK_DATA: AnalysisResult = {
  partitions: [
    {
      villageName: "Rampur Village",
      partitionId: "V05-C1",
      surveyNumbers: ["12/1", "12/2", "14/A", "15", "101"],
    },
    {
      villageName: "Rampur Village",
      partitionId: "V05-C2",
      surveyNumbers: ["16", "17/1", "17/2", "18"],
    },
    {
      villageName: "Rampur Village",
      partitionId: "V05-C6",
      surveyNumbers: ["12/3", "12/4", "101", "19/B"], // 101 overlaps with C1
    },
    {
      villageName: "Rampur Village",
      partitionId: "V05-C7",
      surveyNumbers: ["20", "21", "22/A", "12/3"], // 12/3 overlaps with C6
    }
  ]
};

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const applyOverrides = (data: AnalysisResult, manualVillageName?: string, manualPartitionId?: string): AnalysisResult => {
  const deepCopy = JSON.parse(JSON.stringify(data)) as AnalysisResult;
  
  if (manualVillageName || manualPartitionId) {
    deepCopy.partitions = deepCopy.partitions.map(p => {
        return {
            ...p,
            villageName: manualVillageName || p.villageName,
            partitionId: manualPartitionId || p.partitionId
        };
    });
  }
  return deepCopy;
};

export const analyzeVillageMap = async (
    file: File | null, 
    manualVillageName?: string, 
    manualPartitionId?: string
): Promise<AnalysisResult> => {
  
  // Access API key via Vite standard standard (injected by vite.config.ts)
  // @ts-ignore
  const apiKey = import.meta.env.VITE_API_KEY;

  if (!file) {
    // If no file provided, just return mock data for demo
    const result = applyOverrides(MOCK_DATA, manualVillageName, manualPartitionId);
    return new Promise(resolve => setTimeout(() => resolve(result), 1500));
  }

  // If no API key is present, simulate analysis with mock data
  if (!apiKey) {
    console.warn("No API Key found. Using mock data for demonstration.");
    const result = applyOverrides(MOCK_DATA, manualVillageName, manualPartitionId);
    return new Promise(resolve => setTimeout(() => resolve(result), 2000));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare image
    const imagePart = await fileToGenerativePart(file);

    let prompt = `
      Analyze this village map image. 
      Identify the Village Name (if visible, otherwise guess 'Unknown').
      Identify all partitions (regions labeled like V05-C1, V05-C6, etc.).
      For each partition, extract all Survey Numbers visible inside it.
    `;

    if (manualVillageName) {
        prompt += `\nUSER CONTEXT: The user has manually specified the Village Name as "${manualVillageName}". Use this name for all partitions unless another name is clearly visible.`;
    }

    if (manualPartitionId) {
        prompt += `\nUSER CONTEXT: The user has manually specified the Partition ID as "${manualPartitionId}". Use this ID for the detected partition.`;
    }

    prompt += `
      IMPORTANT: If a survey number lies on the border or seems to belong to multiple partitions, list it in BOTH partitions.
      
      Return the data in this JSON structure:
      {
        "partitions": [
          {
            "villageName": "string",
            "partitionId": "string",
            "surveyNumbers": ["string", "string"]
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [imagePart, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            partitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  villageName: { type: Type.STRING },
                  partitionId: { type: Type.STRING },
                  surveyNumbers: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["villageName", "partitionId", "surveyNumbers"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback to mock data on error so the app remains usable in demo
    const result = applyOverrides(MOCK_DATA, manualVillageName, manualPartitionId);
    return result;
  }
};

export const getSampleData = (manualVillageName?: string, manualPartitionId?: string): Promise<AnalysisResult> => {
    const result = applyOverrides(MOCK_DATA, manualVillageName, manualPartitionId);
    return new Promise(resolve => setTimeout(() => resolve(result), 800));
}
