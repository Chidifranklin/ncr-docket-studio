import type { SecurityPatternType } from '../types/docket';

/**
 * Generate mathematical Guilloche paths and SVG definitions
 * Guilloche curves are hypotrochoids/epitrochoids and harmonic multi-frequency waves
 * used in banknotes, official certificates, and genuine carbonless stationery to prevent counterfeiting.
 */

export interface VectorLineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Generate harmonic sinusoidal Guilloche wave curves across a bounding box
export function generateHarmonicGuillocheWavePaths(
  width: number,
  height: number,
  waveCount: number = 8
): string[] {
  const paths: string[] = [];
  const midY = height / 2;
  const segments = 120;
  const stepX = width / segments;

  for (let w = 0; w < waveCount; w++) {
    const phase = (w * Math.PI) / (waveCount / 2);
    const amp1 = 18 + (w % 3) * 6;
    const amp2 = 12 + (w % 2) * 5;
    const freq1 = 0.025 + (w % 4) * 0.005;
    const freq2 = 0.05 - (w % 3) * 0.004;

    let d = '';
    for (let i = 0; i <= segments; i++) {
      const x = i * stepX;
      // Superposition of two harmonic frequencies + phase modulation
      const y =
        midY +
        Math.sin(x * freq1 + phase) * amp1 +
        Math.cos(x * freq2 - phase * 0.5) * amp2;

      if (i === 0) {
        d += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      } else {
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
    }
    paths.push(d);
  }

  return paths;
}

// Mathematical Hypotrochoid Rosette:
// x(t) = (R - r)*cos(t) + p*cos(((R - r) / r)*t)
// y(t) = (R - r)*sin(t) - p*sin(((R - r) / r)*t)
export function generateGuillocheRosettePath(
  centerX: number,
  centerY: number,
  R: number = 65,
  r: number = 24,
  p: number = 38,
  loops: number = 14
): string {
  const totalSteps = loops * 90;
  const dt = (2 * Math.PI) / 90;
  let d = '';

  for (let i = 0; i <= totalSteps; i++) {
    const t = i * dt;
    const k = (R - r) / r;
    const x = centerX + (R - r) * Math.cos(t) + p * Math.cos(k * t);
    const y = centerY + (R - r) * Math.sin(t) - p * Math.sin(k * t);

    if (i === 0) {
      d += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    } else {
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
  }

  return d;
}

// Concentric Guilloche Security Wavy Rings
export function generateSecurityWavyRings(
  centerX: number,
  centerY: number,
  ringCount: number = 7
): string[] {
  const paths: string[] = [];
  const steps = 100;
  const dTheta = (2 * Math.PI) / steps;

  for (let rIdx = 1; rIdx <= ringCount; rIdx++) {
    const baseRadius = 25 + rIdx * 14;
    const waveAmp = 2.5 + (rIdx % 3);
    const waveFreq = 16 + (rIdx % 4) * 2;
    let d = '';

    for (let i = 0; i <= steps; i++) {
      const theta = i * dTheta;
      const rad = baseRadius + Math.sin(theta * waveFreq) * waveAmp;
      const x = centerX + rad * Math.cos(theta);
      const y = centerY + rad * Math.sin(theta);

      if (i === 0) {
        d += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      } else {
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
    }
    paths.push(d);
  }

  return paths;
}

// Generate discrete line segments for pdf-lib vector drawing
export function getPatternLinesForPdf(
  pattern: SecurityPatternType,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number
): VectorLineSegment[] {
  const segments: VectorLineSegment[] = [];

  if (pattern === 'none') return segments;

  if (pattern === 'guilloche_wave') {
    const waves = 6;
    const steps = 40;
    const midY = boxY + boxHeight / 2;
    const stepX = boxWidth / steps;

    for (let w = 0; w < waves; w++) {
      const phase = (w * Math.PI) / 3;
      const amp = 14 + (w % 2) * 5;
      const freq = 0.03 + (w % 3) * 0.005;

      let prevX = boxX;
      let prevY = midY + Math.sin(phase) * amp;

      for (let i = 1; i <= steps; i++) {
        const currX = boxX + i * stepX;
        const currY = midY + Math.sin(i * stepX * freq + phase) * amp;
        segments.push({ x1: prevX, y1: prevY, x2: currX, y2: currY });
        prevX = currX;
        prevY = currY;
      }
    }
  } else if (pattern === 'geometric_diamond' || pattern === 'banknote_lattice') {
    // Subtle cross-hatch micro lines
    const spacing = 18;
    for (let x = boxX - boxHeight; x < boxX + boxWidth + boxHeight; x += spacing) {
      segments.push({
        x1: Math.max(boxX, x),
        y1: boxY,
        x2: Math.min(boxX + boxWidth, x + boxHeight),
        y2: boxY + boxHeight,
      });
      segments.push({
        x1: Math.min(boxX + boxWidth, x + boxHeight),
        y1: boxY,
        x2: Math.max(boxX, x),
        y2: boxY + boxHeight,
      });
    }
  } else if (pattern === 'guilloche_rosette' || pattern === 'security_rings') {
    const cx = boxX + boxWidth / 2;
    const cy = boxY + boxHeight / 2;
    const steps = 36;
    const rings = 4;
    for (let r = 1; r <= rings; r++) {
      const radius = 20 + r * 16;
      let prevX = cx + radius;
      let prevY = cy;
      for (let i = 1; i <= steps; i++) {
        const theta = (i * 2 * Math.PI) / steps;
        const rad = radius + Math.sin(theta * 12) * 2;
        const currX = cx + rad * Math.cos(theta);
        const currY = cy + rad * Math.sin(theta);
        segments.push({ x1: prevX, y1: prevY, x2: currX, y2: currY });
        prevX = currX;
        prevY = currY;
      }
    }
  }

  return segments;
}
