# Sprite Generation Prompts

Generate all plant sprites using Microsoft Copilot (DALL-E 3). Upload `assets/sprites/objects/Farming Plants.png` as a reference image in every Copilot session before using any prompt below.

## Workflow Overview

1. Generate the **potted** 3-stage sprite sheet for each plant (one Copilot prompt per plant). Sprite sheets contain sprout, full, and bloom frames only — the seed stage uses a single shared sprite (`assets/sprites/plants/seed.png`) and is NOT part of per-plant sheets.
2. In Piskel, open the potted sprite sheet, erase the pot pixels on all 3 frames, save as the **planted** variant (transparent base — the garden renderer overlays this on a Sprout Lands tilled dirt tile)

**Total Copilot prompts: 30** (one 3-stage sprite sheet per plant)
**Total sprite sheets to produce: 60** (30 plants × 2 variants, planted derived from potted in Piskel) + 1 shared seed sprite

---

## Step 1 — Style Reference Sheet (Sunflower, do once)

Upload `assets/sprites/objects/Farming Plants.png` as a reference image, then use this prompt:

**Filename:** `assets/sprites/plants/happy-sunflower-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a sunflower in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```

Then in Piskel: open `happy-sunflower-potted.png`, erase the pot pixels on each of the 3 frames, save as `assets/sprites/plants/happy-sunflower-planted.png`.

---

## Step 2 — Individual Plant Sprites (29 remaining plants)

For each plant: upload `assets/sprites/objects/Farming Plants.png` as reference, generate the potted 3-stage sprite sheet, then derive the planted variant in Piskel by erasing the pot pixels on all 3 frames.

### sad — Bleeding Heart
**Filename:** `assets/sprites/plants/sad-bleeding-heart-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Bleeding Heart in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/sad-bleeding-heart-planted.png`

### Angry — Cactus
**Filename:** `assets/sprites/plants/angry-cactus-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Cactus in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/angry-cactus-planted.png`

### anxious — Passionflower
**Filename:** `assets/sprites/plants/anxious-passionflower-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Passionflower in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/anxious-passionflower-planted.png`

### Calm — Lavender
**Filename:** `assets/sprites/plants/calm-lavender-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Lavender in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/calm-lavender-planted.png`

### Grateful — Hydrangea
**Filename:** `assets/sprites/plants/grateful-hydrangea-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Hydrangea in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/grateful-hydrangea-planted.png`

### Love — Rose
**Filename:** `assets/sprites/plants/love-rose-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Rose in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/love-rose-planted.png`

### Hope — Daffodil
**Filename:** `assets/sprites/plants/hope-daffodil-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Daffodil in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/hope-daffodil-planted.png`

### Excited — Bird of Paradise
**Filename:** `assets/sprites/plants/excited-bird-of-paradise-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Bird of Paradise in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/excited-bird-of-paradise-planted.png`

### Lonely — Forget-Me-Not
**Filename:** `assets/sprites/plants/lonely-forget-me-not-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Forget-Me-Not in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/lonely-forget-me-not-planted.png`

### Proud — Orchid
**Filename:** `assets/sprites/plants/proud-orchid-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing an Orchid in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/proud-orchid-planted.png`

### Confused — Wisteria
**Filename:** `assets/sprites/plants/confused-wisteria-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Wisteria in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/confused-wisteria-planted.png`

### Peaceful — Lotus
**Filename:** `assets/sprites/plants/peaceful-lotus-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Lotus in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/peaceful-lotus-planted.png`

### Nostalgic — Cherry Blossom
**Filename:** `assets/sprites/plants/nostalgic-cherry-blossom-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Cherry Blossom in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/nostalgic-cherry-blossom-planted.png`

### jealous — Nightshade
**Filename:** `assets/sprites/plants/jealous-nightshade-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Nightshade in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/jealous-nightshade-planted.png`

### Inspired — Iris
**Filename:** `assets/sprites/plants/inspired-iris-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing an Iris in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/inspired-iris-planted.png`

### Guilty — Thistle
**Filename:** `assets/sprites/plants/guilty-thistle-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Thistle in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/guilty-thistle-planted.png`

### Curious — Snapdragon
**Filename:** `assets/sprites/plants/curious-snapdragon-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Snapdragon in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/curious-snapdragon-planted.png`

### Frustrated — Bramble
**Filename:** `assets/sprites/plants/frustrated-bramble-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Bramble in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/frustrated-bramble-planted.png`

### Content — Chamomile
**Filename:** `assets/sprites/plants/content-chamomile-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Chamomile in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/content-chamomile-planted.png`

### Overwhelmed — Morning Glory
**Filename:** `assets/sprites/plants/overwhelmed-morning-glory-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing Morning Glory in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/overwhelmed-morning-glory-planted.png`

### brave — Protea
**Filename:** `assets/sprites/plants/brave-protea-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Protea in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/brave-protea-planted.png`

### Embarrassed — Mimosa
**Filename:** `assets/sprites/plants/embarrassed-mimosa-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Mimosa in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/embarrassed-mimosa-planted.png`

### Surprised — Stargazer Lily
**Filename:** `assets/sprites/plants/surprised-stargazer-lily-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Stargazer Lily in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/surprised-stargazer-lily-planted.png`

### bored — Dandelion
**Filename:** `assets/sprites/plants/bored-dandelion-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Dandelion in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/bored-dandelion-planted.png`

### Determined — Gladiolus
**Filename:** `assets/sprites/plants/determined-gladiolus-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing Gladiolus in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/determined-gladiolus-planted.png`

### Compassionate — Aloe Vera
**Filename:** `assets/sprites/plants/compassionate-aloe-vera-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing an Aloe Vera in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/compassionate-aloe-vera-planted.png`

### Melancholy — Bluebell
**Filename:** `assets/sprites/plants/melancholy-bluebell-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Bluebell in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/melancholy-bluebell-planted.png`

### Joyful — Daisy
**Filename:** `assets/sprites/plants/joyful-daisy-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Daisy in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/joyful-daisy-planted.png`

### Vulnerable — Snowdrop
**Filename:** `assets/sprites/plants/vulnerable-snowdrop-potted.png`
```
Generate a 32x32 pixel art sprite sheet showing a Snowdrop in a small clay pot at 3 growth stages (sprout, full plant, blooming), arranged horizontally in a single image, in the same style as the reference image, transparent background, top-down view, no gaps between frames, frames touching edge to edge, no padding, no border, sprites fill the entire canvas. 
```
Planted variant: open in Piskel, erase pot pixels on all 3 frames, save as `assets/sprites/plants/vulnerable-snowdrop-planted.png`
