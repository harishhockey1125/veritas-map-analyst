import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AnalysisConfig, AnalysisMode, ModelType } from "../types";

// --- HELPER: Wait function for retries ---
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to construct the system prompt based on mode
const getSystemInstruction = (mode: AnalysisMode, config: AnalysisConfig): string => {
  const base = "You are Veritas, a world-class text analysis AI known for precision, depth, and unwavering accuracy.";
  
  switch (mode) {
    case AnalysisMode.MAP_EXTRACTION:
      let mapPrompt = `${base} Your task is to perform high-precision OCR and spatial analysis on the provided map image(s).`;
      
      mapPrompt += `\n\nCRITICAL OUTPUT REQUIREMENT: You must generate a MARKDOWN TABLE.`;
      
      if (config.targetColumns) {
        mapPrompt += `\nColumns must be EXACTLY: [${config.targetColumns}].`;
      } else {
        mapPrompt += `\nColumns: Boundary/Area Label, Khasara/Survey No, Remarks.`;
      }

      mapPrompt += `\n\nBoundary & Overlap Rules:\n`;
      mapPrompt += `1. Identify the boundary label (e.g., V09-c2) for each section.\n`;
      mapPrompt += `2. Extract the required numbers (Khasara/Survey) inside that boundary.\n`;
      mapPrompt += `3. OVERLAP RULE: If a plot/number falls on a boundary line or is shared, create a row for IT IN BOTH BOUNDARIES.\n`;
      mapPrompt += `4. In 'Remarks', explicitly state "Shared with [Other Boundary]" or "On Boundary Line".\n`;
      mapPrompt += `5. If the input consists of multiple images, treat them as parts of a single larger map and combine all data into ONE unified table.\n`;
      
      if (config.extractionInstructions) {
        mapPrompt += `\n\nUSER SPECIFIC FORMATTING RULES (MUST FOLLOW):\n${config.extractionInstructions}\n`;
      }
      
      mapPrompt += `\nDo not include introductory text. Output ONLY the Markdown table followed by a brief 1-sentence summary.`;
      return mapPrompt;

    case AnalysisMode.SUMMARIZE:
      return `${base} Your task is to provide a comprehensive yet concise summary. Capture the core message and key details without losing nuance. Structure with clear headings if necessary.`;
    case AnalysisMode.SENTIMENT:
      return `${base} Your task is to analyze the sentiment and emotional tone of the text. Identify the primary emotions, the intensity, and any shifts in tone throughout the text.`;
    case AnalysisMode.PROOFREAD:
      return `${base} Your task is to proofread the text for grammatical errors, spelling mistakes, and stylistic improvements. Provide the corrected text and a list of changes explained clearly.`;
    case AnalysisMode.FACT_CHECK:
      return `${base} Your task is to extract all factual claims, entities (people, places, organizations), and data points from the text. Present them in a structured list.`;
    case AnalysisMode.LOGIC_CHECK:
      return `${base} Your task is to analyze the logical flow and consistency of the text. Identify any fallacies, contradictions, or weak arguments.`;
    case AnalysisMode.CUSTOM:
      return `${base} Follow the user's specific instructions for analysis with extreme attention to detail.`;
    case AnalysisMode.GENERAL:
    default:
      return `${base} Provide a general deep-dive analysis of the text, covering its themes, structure, tone, and key takeaways.`;
  }
};

export const streamAnalysis = async (
  text: string,
  config: AnalysisConfig,
  onChunk: (text: string) => void
): Promise<string> => {
  // Use process.env.API_KEY directly as per guidelines
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  // Construct the parts array for multimodal or text-only input
  const parts: any[] = [];

  // Add images if present (Handling Bulk Uploads)
  if (config.images && config.images.length > 0) {
    config.images.forEach(img => {
      parts.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType
        }
      });
    });
  }

  // Construct text prompt
  let userPrompt = text;
  if (config.mode === AnalysisMode.CUSTOM && config.customPrompt) {
    userPrompt = `CONTEXT:\n${text}\n\nINSTRUCTION:\n${config.customPrompt}`;
  } else if (config.mode === AnalysisMode.MAP_EXTRACTION) {
    const context = text.trim() ? `Additional Context: ${text}\n` : "";
    userPrompt = `${context}Analyze the provided image(s) and extract the data into the requested table format. Ensure all overlaps are noted.`;
  }

  // Add text part
  if (userPrompt.trim()) {
    parts.push({ text: userPrompt });
  }

  const modelConfig: any = {
    systemInstruction: getSystemInstruction(config.mode, config),
  };

  // Apply Thinking Config if using Pro Reasoning
  if (config.model === ModelType.PRO_REASONING) {
    modelConfig.thinkingConfig = {
      thinkingBudget: config.thinkingBudget
    };
  }

  // --- RETRY LOGIC START ---
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model: config.model,
        contents: { parts },
        config: modelConfig,
      });

      let fullText = "";

      for await (const chunk of responseStream) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
          fullText += chunkText;
          onChunk(fullText);
        }
      }

      // If we finish the loop successfully, return the text
      return fullText;

    } catch (error: any) {
      // Check if it is a Rate Limit (429) or Quota Exceeded error
      const isRateLimit = 
        error.status === 429 || 
        (error.message && error.message.includes("429")) || 
        (error.message && error.message.includes("Quota exceeded"));

      if (isRateLimit) {
        attempt++;
        if (attempt >= MAX_RETRIES) {
          console.error("Max retries exceeded for Rate Limit.");
          throw error; // Give up after max retries
        }

        // Exponential backoff: Wait 5s, then 10s, then 15s
        const delayTime = attempt * 5000;
        console.warn(`Rate limit hit (429). Retrying attempt ${attempt} of ${MAX_RETRIES} in ${delayTime}ms...`);
        
        // Wait before looping again
        await wait(delayTime);
      } else {
        // If it's NOT a rate limit error (e.g. Invalid API Key, Bad Request), fail immediately
        console.error("Non-retriable error analyzing text:", error);
        throw error;
      }
    }
  }
  // --- RETRY LOGIC END ---

  throw new Error("Unexpected end of analysis stream.");
};
