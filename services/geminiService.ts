
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PixelCrop } from 'react-image-crop';

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked by safety filters (Prompt). Reason: ${blockReason}. ${blockReasonMessage || 'Try using a less specific prompt or a broader focus.'}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check finish reason
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Generation stopped by model safety system (FinishReason: ${finishReason}). This often happens when focusing on specific human features at high zoom levels. Technical Mitigation: Try a slightly different zoom level or frame the request as a "Macro Detail Study".`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    let textFeedback = "";
    try {
        textFeedback = response.text || "";
    } catch (e) {
        // Text property might not be available
    }

    const errorMessage = `No image output detected for ${context}. ` + 
        (textFeedback.trim() 
            ? `AI Feedback: "${textFeedback.trim()}"`
            : "The system blocked the output for safety or complexity reasons.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

const CLINICAL_CONTEXT = "Scientific Image Processing Protocol: Execute high-fidelity anatomical reconstruction and optical simulation. Maintain 100% texture, geometry, and identity consistency. Avoid all creative interpretation; prioritize technical accuracy and photographic fidelity.";

export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `${CLINICAL_CONTEXT}
Technical Command: Targeted localized edit at coordinate (${hotspot.x}, ${hotspot.y}).
Modification: "${userPrompt}"
Requirements: Preserve surrounding pixel-state. Return final processed result only.`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: prompt }] },
    });

    return handleApiResponse(response, 'edit');
};

export const generateFilteredImage = async (originalImage: File, filterPrompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `${CLINICAL_CONTEXT}
Technical Command: Stylistic pixel re-mapping: "${filterPrompt}".
Requirements: Preserve geometry. Return image only.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: prompt }] },
    });
    return handleApiResponse(response, 'filter');
};

export const generateAdjustedImage = async (originalImage: File, adjustmentPrompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `${CLINICAL_CONTEXT}
Technical Command: Global optical adjustment: "${adjustmentPrompt}".
Requirements: Return image only.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: prompt }] },
    });
    return handleApiResponse(response, 'adjustment');
};

export const generateExpandedImage = async (paddedImage: File, userPrompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const paddedImagePart = await fileToPart(paddedImage);
    const prompt = `${CLINICAL_CONTEXT}
Technical Command: Spatial scene extension (Outpainting).
Context: "${userPrompt}"
Requirements: Predict and reconstruct environment based on existing edge pixel metadata. Return image only.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [paddedImagePart, { text: prompt }] },
    });
    return handleApiResponse(response, 'expansion');
};

export const generateHarmonizedImage = async (
    originalImage: File,
    userPrompt: string,
    foregroundHotspot: { x: number; y: number },
    backgroundHotspot: { x: number; y: number },
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `${CLINICAL_CONTEXT}
Technical Command: Compositing harmonization.
Points: FG(${foregroundHotspot.x}, ${foregroundHotspot.y}), BG(${backgroundHotspot.x}, ${backgroundHotspot.y}).
Instruction: "${userPrompt}"
Requirements: Synchronize lighting, shadow projection, and focal depth between planes. Return image only.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: prompt }] },
    });
    return handleApiResponse(response, 'harmonization');
};

export const generateEnhancedImage = async (originalImage: File, userPrompt: string, crop: PixelCrop): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `${CLINICAL_CONTEXT}
Technical Command: Localized super-resolution enhancement.
ROI: x:${crop.x}, y:${crop.y}, w:${crop.width}, h:${crop.height}.
Target Detail: "${userPrompt}"
Requirements: Synthesize additional high-frequency details while adhering to source identity. Return image only.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: prompt }] },
    });
    return handleApiResponse(response, 'enhancement');
};

export const generateReframedImage = async (originalImage: File, cameraAnglePrompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `${CLINICAL_CONTEXT}
Technical Command: Perspective projection re-rendering.
New Camera Vector: "${cameraAnglePrompt}"
Requirements: Reconstruct subject and environment from the specified angle. Preserve anatomical integrity. Return image only.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: prompt }] },
    });
    return handleApiResponse(response, 'reframe');
};

export const generateZoomedImage = async (originalImage: File, zoomPrompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `${CLINICAL_CONTEXT}
Technical Command: Virtual lens focal length simulation.
Operation: "${zoomPrompt}"
Guidelines: 
- For magnification: Perform high-fidelity texture study and detail reconstruction.
- For reduction: Perform seamless environmental extension.
- Strictly adhere to technical photographic physics. Return ONLY image data.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: prompt }] },
    });
    return handleApiResponse(response, 'zoom');
};

export const generateCombinedImage = async (
    destinationImage: File,
    sourceImage: File,
    userPrompt: string,
    insertionPoint: { x: number; y: number }
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const destinationImagePart = await fileToPart(destinationImage);
    const sourceImagePart = await fileToPart(sourceImage);
    const prompt = `${CLINICAL_CONTEXT}
Technical Command: Dual-subject multi-source integration.
Target: (${insertionPoint.x}, ${insertionPoint.y}).
Instruction: "${userPrompt}"
Requirements: Extract subject from Source, integrate into Destination. Resolve all occlusion and interaction artifacts. Return image only.`;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [destinationImagePart, sourceImagePart, { text: prompt }] },
    });
    return handleApiResponse(response, 'combination');
};
