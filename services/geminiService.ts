import { GoogleGenAI, Type } from "@google/genai";
import { BrandStyle, GeneratedAsset } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeBrandFromUrl = async (url: string): Promise<BrandStyle> => {
  const ai = getClient();
  
  const prompt = `
    Analyze the brand and visual style of the website: ${url}.
    Use Google Search to find information about the brand's logo, colors, and design language.
    If the website is not well-known, infer a suitable style based on the domain name and industry standards for that type of site.
    
    Return a JSON object with:
    - brandName: The name of the brand.
    - themeDescription: A concise description of the visual theme (e.g., 'futuristic cyber-security dark mode with neon accents').
    - dominantColors: An array of 5-7 hex color codes representing the palette.
    - fontStyle: A description of the typography (e.g., 'Clean geometric sans-serif').
    - layoutVibe: The structural feel (e.g., 'Grid-based masonry', 'Minimalist single column').
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          brandName: { type: Type.STRING },
          themeDescription: { type: Type.STRING },
          dominantColors: { type: Type.ARRAY, items: { type: Type.STRING } },
          fontStyle: { type: Type.STRING },
          layoutVibe: { type: Type.STRING },
        },
        required: ["brandName", "themeDescription", "dominantColors", "fontStyle", "layoutVibe"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Failed to analyze brand.");
  
  return JSON.parse(text) as BrandStyle;
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
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: {
      // @ts-ignore - 'imageConfig' types might be strict in some versions, but this structure is correct for 2.5-flash-image
      imageConfig: {
        aspectRatio: "1:1",
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

export const generateSocialMock = async (
  style: BrandStyle,
  platform: 'Instagram' | 'Twitter' | 'LinkedIn'
): Promise<GeneratedAsset> => {
  const ai = getClient();
  
  let aspectRatio = "1:1";
  let desc = "";

  switch (platform) {
    case 'Instagram':
      aspectRatio = "1:1";
      desc = "An engaging Instagram social media post.";
      break;
    case 'Twitter':
      aspectRatio = "16:9";
      desc = "A professional Twitter header banner.";
      break;
    case 'LinkedIn':
      aspectRatio = "16:9"; // LinkedIn covers are roughly this or slimmer, but 16:9 is safe standard
      desc = "A corporate LinkedIn cover photo.";
      break;
  }

  const prompt = `
    Create a ${desc} for the brand "${style.brandName}".
    Theme: ${style.themeDescription}.
    Typography: ${style.fontStyle}.
    Colors: ${style.dominantColors.join(', ')}.
    Content: Include placeholder text and abstract visual elements fitting the theme.
    Make it look like a high-quality, ready-to-use template.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: {
       // @ts-ignore
       imageConfig: {
        aspectRatio: aspectRatio,
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

  if (!imageUrl) throw new Error("Failed to generate social mock");

  return {
    id: `social-${platform}-${Date.now()}`,
    type: 'social',
    subtype: platform,
    imageUrl,
    description: `${platform} Template`,
  };
};