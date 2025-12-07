import { GoogleGenAI, Type } from "@google/genai";
import { BrandStyle, GeneratedAsset } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Demo Data for Fallback/Testing
export const getDemoBrandStyle = (): BrandStyle => ({
  brandName: "NeonFlux",
  themeDescription: "Cyberpunk aesthetic with high-contrast neon accents against deep void black.",
  dominantColors: ["#09090B", "#00F0FF", "#7000FF", "#FF003C", "#FFFFFF"],
  fontStyle: "Futuristic Sans-Serif (Orbitron/Inter)",
  layoutVibe: "Asymmetrical grid, glowing borders, glitch effects"
});

// Helper to fetch screenshot and convert to base64
async function fetchScreenshotBase64(url: string, onLog?: (msg: string) => void): Promise<string | null> {
  try {
    onLog?.(`Initiating screenshot capture for ${url}...`);
    // Normalize URL
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Using thum.io as a screenshot service. 
    const screenshotUrl = `https://image.thum.io/get/width/1024/crop/800/noanimate/${targetUrl}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for screenshot

    onLog?.("Sending request to screenshot service...");
    const response = await fetch(screenshotUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      onLog?.(`Screenshot service returned status: ${response.status}`);
      return null;
    }
    
    const blob = await response.blob();
    // Basic check to ensure we got an image
    if (!blob.type.startsWith('image/')) {
       onLog?.(`Invalid content type received: ${blob.type}`);
       return null;
    }

    onLog?.("Screenshot captured successfully. Converting to Base64...");
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        if (!res) {
          onLog?.("FileReader result is empty.");
          resolve(null as any);
          return;
        }
        // Strip the data:image/png;base64, part if present
        resolve(res.split(',')[1]); 
      };
      reader.onerror = () => {
        onLog?.("Failed to read blob data.");
        resolve(null as any);
      }
      reader.readAsDataURL(blob); 
    });
  } catch (e) {
    onLog?.(`Screenshot failed (using text fallback): ${e instanceof Error ? e.message : 'Unknown error'}`);
    console.warn("Screenshot fetch failed or timed out, falling back to text analysis:", e);
    return null;
  }
}

export const analyzeBrandFromUrl = async (url: string, onLog?: (msg: string) => void): Promise<BrandStyle> => {
  const ai = getClient();
  
  onLog?.("Step 1: Fetching visual context...");
  const screenshotBase64 = await fetchScreenshotBase64(url, onLog);
  
  const inputParts: any[] = [];
  
  if (screenshotBase64) {
    onLog?.("Visual context acquired. Attaching image to prompt.");
    inputParts.push({
      inlineData: {
        mimeType: 'image/png',
        data: screenshotBase64
      }
    });
  } else {
    onLog?.("No visual context available. Proceeding with text/search analysis.");
  }

  let prompt = `
    Analyze the brand and visual style of the website: ${url}.
  `;

  if (screenshotBase64) {
    prompt += `
    I have provided a screenshot of the website. 
    1. ANALYZE the image to determine the dominant color palette (extract hex codes from the image pixels).
    2. OBSERVE the layout structure (hero section, navigation, density).
    3. DETECT the typography style (serif vs sans-serif, weights, mood).
    If the image appears to be a "loading" placeholder or "screenshot failed" image, IGNORE the image and use Google Search instead.
    `;
  } else {
    prompt += `
    Use Google Search to find information about the brand's logo, colors, and design language.
    `;
  }

  prompt += `
    If the website is not well-known, infer a suitable style based on the domain name and industry standards.
    
    Return a VALID JSON object (no markdown, just raw JSON) with the following specific structure:
    {
      "brandName": "Name of the brand",
      "themeDescription": "A concise description of the visual theme",
      "dominantColors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "fontStyle": "Description of typography",
      "layoutVibe": "Description of layout structure"
    }
  `;

  inputParts.push({ text: prompt });

  onLog?.("Step 2: Sending request to Gemini 3 Pro...");

  // IMPORTANT: We set a timeout for the Gemini call itself
  // Increased to 40s for Gemini 3 Pro multimodal latency
  const geminiPromise = ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: inputParts
    },
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  // Timeout wrapper
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Gemini API timed out after 40s")), 40000)
  );

  try {
    const response: any = await Promise.race([geminiPromise, timeoutPromise]);
    
    onLog?.("Gemini response received.");
    let text = response.text;
    
    if (!text) {
      onLog?.("Error: Empty text response from Gemini.");
      throw new Error("Failed to analyze brand.");
    }
    
    onLog?.("Step 3: Parsing analysis results...");
    // Clean up potential markdown code blocks
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();

    try {
      const result = JSON.parse(text) as BrandStyle;
      onLog?.("Analysis complete. Style definition ready.");
      return result;
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      onLog?.("Error: Invalid JSON format received.");
      throw new Error("Failed to parse brand analysis results.");
    }

  } catch (error: any) {
    onLog?.(`Critical Error: ${error.message}`);
    throw error;
  }
};

export const generateLogoVariant = async (
  style: BrandStyle,
  variant: string
): Promise<GeneratedAsset> => {
  const ai = getClient();
  const prompt = `
    Design a professional logo for the brand "${style.brandName}".
    Style: ${style.themeDescription}.
    Variant: ${variant}.
    Colors: Use the palette ${style.dominantColors.join(', ')}.
    Vibe: ${style.layoutVibe}.
    Requirements: Flat vector style, simple, scalable, transparent background if possible.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      // @ts-ignore
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });

  let imageUrl = "";
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) throw new Error("Failed to generate logo image");

  return {
    id: `logo-${Date.now()}-${Math.random()}`,
    type: 'logo',
    subtype: variant,
    imageUrl,
    description: `${variant} logo variant`,
  };
};

export const generateBrandAsset = async (
  style: BrandStyle,
  type: 'Billboard' | 'Merch' | 'Poster'
): Promise<GeneratedAsset> => {
  const ai = getClient();
  
  let aspectRatio = "1:1";
  let promptDetails = "";

  switch (type) {
    case 'Billboard':
      aspectRatio = "16:9";
      promptDetails = `A photorealistic wide urban billboard advertisement for "${style.brandName}". 
      High-end 3D city context. Clean, bold typography. `;
      break;
    case 'Merch':
      aspectRatio = "3:4"; 
      promptDetails = `A high-fashion streetwear hoodie mockup featuring the "${style.brandName}" logo. 
      Professional studio lighting, model wearing the merchandise, lifestyle photography. `;
      break;
    case 'Poster':
      aspectRatio = "9:16";
      promptDetails = `A Swiss-style graphic design poster for "${style.brandName}". 
      Vertical format, bold typography, abstract geometric shapes based on brand colors. Artsy and modern.`;
      break;
  }

  const prompt = `
    Create a ${promptDetails}
    
    Brand Identity:
    - Theme: ${style.themeDescription}
    - Colors: ${style.dominantColors.join(', ')}
    - Vibe: ${style.layoutVibe}
    
    Make it look like a high-budget professional brand asset.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
       // @ts-ignore
       imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: "1K"
      }
    }
  });

  let imageUrl = "";
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) throw new Error(`Failed to generate ${type}`);

  return {
    id: `asset-${type}-${Date.now()}`,
    type: 'social', // keeping type as social for asset grid compatibility, though 'brand' might be better conceptually
    subtype: type,
    imageUrl,
    description: `${type} Mockup`,
  };
};