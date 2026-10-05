import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Boatrace theme SVG: Water ripple, dynamic speed waves, speedboat silhouette, AI badge
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a192f"/>
      <stop offset="50%" stop-color="#0f2b48"/>
      <stop offset="100%" stop-color="#020c1b"/>
    </linearGradient>
    <linearGradient id="water" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00b4d8" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#90e0ef" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0077b6" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="boatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#b91c1c"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="104" fill="url(#bg)"/>
  
  <!-- Subtle water ripples -->
  <path d="M 40 370 Q 140 340, 260 370 T 480 370" fill="none" stroke="url(#water)" stroke-width="6" opacity="0.6"/>
  <path d="M 20 410 Q 150 380, 280 410 T 500 410" fill="none" stroke="url(#water)" stroke-width="8" opacity="0.8"/>
  <path d="M 50 450 Q 170 420, 310 450 T 490 450" fill="none" stroke="url(#water)" stroke-width="5" opacity="0.5"/>

  <!-- Speed boat wake / splash -->
  <path d="M 110 320 L 70 345 L 140 335 Z" fill="#38bdf8" opacity="0.7"/>
  <path d="M 80 340 L 40 360 L 110 350 Z" fill="#0284c7" opacity="0.5"/>

  <!-- Hydroplane Racing Boat Hull -->
  <g transform="translate(40, -10)">
    <!-- Speed boat body -->
    <path d="M 120 280 L 320 230 Q 360 220, 390 230 L 410 240 Q 390 265, 330 285 L 150 310 Z" fill="url(#boatGrad)" stroke="#64748b" stroke-width="3" filter="url(#glow)"/>
    <!-- Red racing stripe / number 1 color -->
    <path d="M 210 262 L 325 235 L 350 248 L 225 277 Z" fill="url(#accentGrad)"/>
    <!-- Racer silhouette & helmet leaning forward -->
    <circle cx="270" cy="205" r="28" fill="#f8fafc"/>
    <path d="M 270 190 Q 295 195, 298 215 L 265 215 Z" fill="#0f172a"/>
    <path d="M 245 228 Q 275 220, 305 240 L 290 260 L 235 255 Z" fill="#e2e8f0"/>
    
    <!-- Cowling / Number 1 plate -->
    <circle cx="190" cy="275" r="18" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>
    <text x="190" y="282" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#0f172a" text-anchor="middle">1</text>
  </g>

  <!-- AI Badge -->
  <g transform="translate(325, 60)">
    <rect width="130" height="56" rx="28" fill="#2563eb" stroke="#60a5fa" stroke-width="3"/>
    <text x="65" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="#ffffff" text-anchor="middle" letter-spacing="2">AI</text>
  </g>

  <!-- Title / Mark -->
  <text x="256" y="115" font-family="'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" font-weight="900" font-size="44" fill="#f8fafc" text-anchor="middle" letter-spacing="4">
    BOATRACE
  </text>
  <text x="256" y="152" font-family="'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" font-weight="700" font-size="22" fill="#38bdf8" text-anchor="middle" letter-spacing="6">
    STATISTICAL PREDICTION
  </text>
</svg>
`.trim();

// Maskable version with safe-zone margin (inner 80% circle)
const maskableSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a192f"/>
      <stop offset="50%" stop-color="#0f2b48"/>
      <stop offset="100%" stop-color="#020c1b"/>
    </linearGradient>
    <linearGradient id="water" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00b4d8" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#90e0ef" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0077b6" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="boatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#b91c1c"/>
    </linearGradient>
  </defs>

  <!-- Full-bleed background -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- Centered safe-zone scaled content (0.8 scale) -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <path d="M 40 370 Q 140 340, 260 370 T 480 370" fill="none" stroke="url(#water)" stroke-width="8" opacity="0.6"/>
    <path d="M 20 410 Q 150 380, 280 410 T 500 410" fill="none" stroke="url(#water)" stroke-width="10" opacity="0.8"/>
    
    <g transform="translate(40, -10)">
      <path d="M 120 280 L 320 230 Q 360 220, 390 230 L 410 240 Q 390 265, 330 285 L 150 310 Z" fill="url(#boatGrad)" stroke="#64748b" stroke-width="3"/>
      <path d="M 210 262 L 325 235 L 350 248 L 225 277 Z" fill="url(#accentGrad)"/>
      <circle cx="270" cy="205" r="28" fill="#f8fafc"/>
      <path d="M 270 190 Q 295 195, 298 215 L 265 215 Z" fill="#0f172a"/>
      <path d="M 245 228 Q 275 220, 305 240 L 290 260 L 235 255 Z" fill="#e2e8f0"/>
      <circle cx="190" cy="275" r="18" fill="#ffffff" stroke="#0f172a" stroke-width="3"/>
      <text x="190" y="282" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#0f172a" text-anchor="middle">1</text>
    </g>

    <g transform="translate(325, 60)">
      <rect width="130" height="56" rx="28" fill="#2563eb" stroke="#60a5fa" stroke-width="3"/>
      <text x="65" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="#ffffff" text-anchor="middle" letter-spacing="2">AI</text>
    </g>

    <text x="256" y="115" font-family="'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" font-weight="900" font-size="44" fill="#f8fafc" text-anchor="middle" letter-spacing="4">
      BOATRACE
    </text>
    <text x="256" y="152" font-family="'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" font-weight="700" font-size="22" fill="#38bdf8" text-anchor="middle" letter-spacing="6">
      STATISTICAL PREDICTION
    </text>
  </g>
</svg>
`.trim();

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

async function generate() {
  const svgBuf = Buffer.from(svgContent);
  const maskableSvgBuf = Buffer.from(maskableSvgContent);

  await sharp(svgBuf).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(svgBuf).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(maskableSvgBuf).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(svgBuf).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Successfully generated all PWA icons!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
