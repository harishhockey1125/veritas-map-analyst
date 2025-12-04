import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisResult } from "../types";

const MOCK_DATA: AnalysisResult = {
  partitions: [
    {
      villageName: "DEMO VILLAGE",
      partitionId: "V01-C1",
      surveyNumbers: ["101", "102", "103/A"],
      remarks: "No API Key provided - using demo data"
    }
  ]
};

const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
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

export const analyzeVillageMap = async (
    file: File, 
    manualVillageName?: string, 
    manualPartitionId?: string
): Promise<AnalysisResult> => {
    
  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    console.warn("Missing VITE_API_KEY. Using mock data.");
    return new Promise(resolve => setTimeout(() => resolve(MOCK_DATA), 1500));
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imagePart = await fileToGenerativePart(file);
    
    const prompt = `
    Analyze this village map. Extract the following in JSON format:
    1. Village Name (use "${manualVillageName || 'Unknown'}" if provided or not found).
    2. Partition ID (use "${manualPartitionId || 'Unknown'}" if provided or not found).
    3. List of all Survey Numbers visible.
    
    Return ONLY valid JSON:
    {
      "partitions": [
        {
          "villageName": "string",
          "partitionId": "string",
          "surveyNumbers": ["string"]
        }
      ]
    }`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as AnalysisResult;

  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Failed to analyze map");
  }
};

export const getSampleData = async (): Promise<AnalysisResult> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_DATA), 800));
};
