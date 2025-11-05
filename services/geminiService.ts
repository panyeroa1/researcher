import { GoogleGenAI, Modality, Type } from "@google/genai";
import { PITCH_SYSTEM_PROMPT } from '../constants';
import { PresentationSlideData } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const presentationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      sectionTitle: { type: Type.STRING },
      script: { type: Type.STRING },
      imagePrompt: { type: Type.STRING },
    },
    required: ['sectionTitle', 'script', 'imagePrompt'],
  },
};

export const generateLandingPage = async (topic: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Generate the landing page HTML for the following topic: ${topic}`,
            config: {
                systemInstruction: `You are a world-class business consultant. Your task is to produce a concise, powerful, single-page website copy for the given topic, structured with simple HTML tags (<h1>, <h2>, <p>, <ul>, <li>, <strong>, <em>). The content should be persuasive, highlighting the value proposition, key features, market opportunity, and a clear call to action. It must be designed to capture an investor's interest immediately. Do not include <head>, <body>, or <html> tags.`,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating landing page:", error);
        return "Error: Failed to generate landing page content.";
    }
};

export const generatePresentationData = async (landingPageHtml: string): Promise<PresentationSlideData[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Based on the following landing page HTML, generate the structured presentation JSON:\n\n${landingPageHtml}`,
            config: {
                systemInstruction: PITCH_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: presentationSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating presentation data:", error);
        throw new Error("Failed to generate presentation script. The model returned an invalid structure.");
    }
};

export const generatePresentationImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `cinematic, professional, high-resolution photograph of: ${prompt}`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        console.error(`Error generating image for prompt "${prompt}":`, error);
        return null;
    }
};


export const analyzeImage = async (imageData: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                data: imageData,
                mimeType,
            },
        };
        const textPart = { text: prompt };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        return "Failed to analyze image. Please check the console for details.";
    }
};

export const analyzeVideoFrames = async (frames: string[], prompt: string): Promise<string> => {
    try {
        const parts = [
            { text: prompt },
            { text: "Here are the frames from the video:"},
            ...frames.map(frame => ({
                inlineData: {
                    data: frame,
                    mimeType: 'image/jpeg',
                }
            }))
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing video frames:", error);
        return "Failed to analyze video. Please check the console for details.";
    }
};

export const getQuickAnswer = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting quick answer:", error);
        return "Failed to get an answer. Please check the console for details.";
    }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Please narrate the following script in an engaging and professional tone: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};
