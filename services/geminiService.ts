import { GoogleGenAI } from "@google/genai";
import { blobToBase64 } from "../utils/audioUtils";

const API_KEY = process.env.API_KEY || '';

// Initialize the client
const getAiClient = () => new GoogleGenAI({ apiKey: API_KEY });

export const transcribeAudio = async (audioBlob: Blob, mimeType: string, intervalMinutes: number = 2): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is set.");
  }

  try {
    const ai = getAiClient();
    const base64Data = await blobToBase64(audioBlob);
    
    // Fallback mimeType if for some reason it's empty
    const finalMimeType = mimeType || 'audio/mp3';

    // gemini-2.5-flash is excellent for fast, multimodal tasks including audio.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: finalMimeType,
              data: base64Data
            }
          },
          {
            text: `Please transcribe the following audio. 
            
            IMPORTANT: You must structure the transcript by inserting timestamps approximately every ${intervalMinutes} minutes (or at logical breaks near that interval).
            
            Format the timestamps strictly as a header on a new line: "## [MM:SS]".
            Start with "## [00:00]".
            
            Example output format:
            ## [00:00]
            (Text for the first segment...)
            
            ## [0${intervalMinutes}:00]
            (Text for the next segment...)
            
            If there are distinct speakers, label them as Speaker 1, Speaker 2, etc. Format the text with clear paragraph breaks.`
          }
        ]
      }
    });

    if (!response.text) {
      throw new Error("No transcription generated.");
    }

    return response.text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};