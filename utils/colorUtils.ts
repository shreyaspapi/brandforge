import { ColorMetrics } from '../types';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function calculateContrast(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number {
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export const analyzeColor = (hex: string): ColorMetrics => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return { hex, contrastWhite: 0, contrastBlack: 0, accessibility: 'Invalid' };
  }

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  const contrastWhite = parseFloat(calculateContrast(rgb, white).toFixed(2));
  const contrastBlack = parseFloat(calculateContrast(rgb, black).toFixed(2));

  let accessibility = 'Fail';
  if (contrastWhite >= 4.5 || contrastBlack >= 4.5) accessibility = 'AA';
  if (contrastWhite >= 7 || contrastBlack >= 7) accessibility = 'AAA';

  return {
    hex,
    contrastWhite,
    contrastBlack,
    accessibility,
  };
};