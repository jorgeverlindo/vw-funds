import { PromptEntry } from './types';

export const PROMPT_LIBRARY: PromptEntry[] = [
  // ─── Outdoor Scenes — Flux Kontext img2img optimised ─────────────────────────
  // Each prompt tells Flux to replace the vehicle's background with the described
  // scene while preserving the vehicle exactly as-is. Works with KODIAK_VEHICLE_GUARD
  // (prepended at generation time) to lock the subject's colour, decals, and angle.
  {
    id: 'out-desert',
    category: 'outdoor',
    title: 'Desert Dunes at Sunset',
    description: 'Golden sand dunes under warm low-angle sunset light',
    prompt: 'Replace the background with a vast desert of golden sand dunes at sunset. Sweeping dune ridges curve toward the horizon under warm low-angle sunlight. Sky shifts from deep blue overhead to gold and rose near the horizon. Photorealistic outdoor advertising photography, 35mm full-frame, golden-hour lighting.',
  },
  {
    id: 'out-alpine',
    category: 'outdoor',
    title: 'Alpine Trail at Dawn',
    description: 'High-altitude rocky mountain trail with snow-capped peaks',
    prompt: 'Replace the background with a high-altitude rocky mountain trail at dawn. A vista of layered mountain ranges fades into cool morning mist, with snow-capped peaks in the far distance. Soft sunrise light, pale blue and peach sky. Photorealistic outdoor adventure photography, 35mm full-frame.',
  },
  {
    id: 'out-mud',
    category: 'outdoor',
    title: 'Muddy Forest Trail After Rain',
    description: 'Wet forest trail with tire ruts, puddles, and low mist',
    prompt: 'Replace the background with a muddy forest trail just after heavy rain. Wet brown earth with deep tire ruts and shallow puddles, dense pine and fir trees rising into a soft overcast sky. Diffused silver light filters through the canopy, low mist between trunks. Photorealistic outdoor adventure photography, 35mm full-frame.',
  },
  {
    id: 'out-canyon',
    category: 'outdoor',
    title: 'Red Rock Canyon at Midday',
    description: 'Utah-style red sandstone canyon with rust-colored walls and deep blue sky',
    prompt: 'Replace the background with red sandstone slickrock in a desert canyon, reminiscent of southern Utah. Towering rust-colored canyon walls and rock spires in the middle distance, deep blue cloudless sky overhead. Strong overhead midday sunlight. Photorealistic outdoor adventure photography, 35mm full-frame.',
  },
  {
    id: 'out-snow',
    category: 'outdoor',
    title: 'Snowy Pine Forest',
    description: 'Snow-covered evergreen clearing on a quiet overcast winter day',
    prompt: 'Replace the background with a snow-covered pine forest clearing on an overcast winter day. Tall snow-laden evergreen trees surround the scene, fresh snow drifts in the foreground, gentle falling snowflakes in the air. Flat overcast grey-white sky, soft diffused light. Photorealistic outdoor adventure photography, 35mm full-frame.',
  },
  {
    id: 'rac-pit',
    category: 'racing',
    title: 'Pit lane — race day',
    description: 'Race track pit lane atmosphere',
    prompt: 'Race day pit lane, blurred pit crew activity in background, dramatic race atmosphere, strong ambient lighting, motorsports energy',
  },
  {
    id: 'rac-blur',
    category: 'racing',
    title: 'Track — motion blur',
    description: 'Speed impression with track blur',
    prompt: 'Dynamic motion blur photography on race track, sense of high speed, blurred asphalt and barriers, adrenaline-filled composition',
  },
  {
    id: 'rac-night',
    category: 'racing',
    title: 'Night circuit',
    description: 'Night race with dramatic lighting',
    prompt: 'Night circuit racing photography, dramatic floodlights overhead, reflections on wet track, cinematic racing atmosphere',
  },
  {
    id: 'adv-dunes',
    category: 'adventure',
    title: 'Desert dunes',
    description: 'Sandy desert with golden dunes',
    prompt: 'Off-road adventure photography, vast golden sand dunes, dramatic desert sky at golden hour, dust particles in air',
  },
  {
    id: 'adv-forest',
    category: 'adventure',
    title: 'Forest trail',
    description: 'Dense forest trail with dappled light',
    prompt: 'Forest trail adventure, dense green canopy, dappled sunlight breaking through trees, rugged dirt path, nature immersion',
  },
  {
    id: 'adv-mount',
    category: 'adventure',
    title: 'Mountain summit',
    description: 'Rocky mountain top with expansive view',
    prompt: 'Mountain summit overlook, dramatic rocky terrain, expansive valley view below, crisp alpine atmosphere, adventure photography',
  },
  {
    id: 'adv-river',
    category: 'adventure',
    title: 'River crossing',
    description: 'Water crossing in natural setting',
    prompt: 'River crossing off-road photography, splashing water spray, lush riparian vegetation, rugged outdoor capability showcase',
  },
  {
    id: 'lif-coast',
    category: 'lifestyle',
    title: 'Coastal highway',
    description: 'Scenic coastal road with ocean view',
    prompt: 'Coastal highway lifestyle photography, dramatic ocean cliffs, winding road, golden hour light, aspirational travel mood',
  },
  {
    id: 'lif-urban',
    category: 'lifestyle',
    title: 'Urban dusk',
    description: 'City street at dusk with neon reflections',
    prompt: 'Urban dusk automotive photography, wet city streets, neon and ambient light reflections, modern cityscape background, premium lifestyle',
  },
  {
    id: 'fx-speed',
    category: 'fx',
    title: 'Speed lines',
    description: 'Abstract speed lines and motion trails',
    prompt: 'Abstract speed lines effect, radial motion blur emanating from vehicle, dynamic energy trails, high-contrast graphic treatment',
  },
];

export const PROMPT_CATEGORIES = [
  { id: 'outdoor',   label: 'Outdoor Scenes' },
  { id: 'oem',       label: 'OEM Studio' },
  { id: 'racing',    label: 'Racing' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'fx',        label: 'FX' },
] as const;
