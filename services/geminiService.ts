
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

export const transcribeAudio = async (audioData: string, mimeType: string): Promise<string> => {
    try {
        const audioPart = {
            inlineData: {
                data: audioData,
                mimeType,
            },
        };
        const textPart = { text: `You are an expert audio transcriber. Your task is to transcribe the provided audio with extremely high accuracy.
Follow these instructions precisely:
1.  **Full Transcription**: Transcribe the entire audio from beginning to end. Do not summarize or omit any parts.
2.  **Speaker Diarization**: If there are multiple speakers, identify and label each one consistently (e.g., "Speaker 1:", "Speaker 2:").
3.  **Capture Tone and Style**: Go beyond just words. Preserve the original tone, style, and emotional nuance of the speakers. For example, use punctuation and formatting to reflect pauses, emphasis, or changes in emotion (e.g., excitement, hesitation). The final text should read as if it were spoken by the original speakers.
4.  **Verbatim Accuracy**: Capture every word, including filler words (uh, um), false starts, and stutters, as they are crucial to the natural flow of conversation.
5.  **Formatting**: Present the transcription in a clean, readable script format.` };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [textPart, audioPart] },
        });
        return response.text;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return "Failed to transcribe audio. Please ensure the audio format is supported and check the console for details.";
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

export const generateSpeech = async (text: string, voiceName: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `<speak>${text}</speak>` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
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
