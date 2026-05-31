# Art Asset Drop-In Folders

These folders hold generated or final game art. The first layered street-alley stage is included.

```text
assets/
  fighters/
    fighter-1/
      idle.png
      walk.png
      ...
    fighter-2/
      idle.png
      walk.png
      ...
  stages/
    street-alley/
      bg-far.png
      bg-mid.png
      floor.png
      fg-overlay.png
      thumbnail.png
  ui/
    arcade-ui-atlas.png
  vfx/
    hit-sparks.png
    dust-puff.png
    energy-slash.png
  splash/
  audio/
    street-alley-loop.mp3
```

Transparent PNG files work best for future parallax layers, foreground overlays, and VFX sprites. The submitted foreground and VFX files are opaque RGB images, so their runtime shaders use restrained opacity or pale-background filtering to preserve gameplay readability.

`ui/arcade-ui-atlas.png` is the optional arcade interface sheet. `UiAtlasSprite` only enables its decorative crops after the image loads successfully. Health bars, callouts, character cards, and overlay panels keep CSS fallbacks underneath.

Sprite fighters use one-row PNG sheets. Set each animation frame count in `src/game/spriteFighters.ts`; the renderer infers frame width from the sheet width divided by that count and reads frame height directly from the image. Missing sheets automatically render a generated fallback fighter. A move can optionally set `fallbackAnimation` while final art is pending.

`fighter-1/anchor.png` is a static Safari Striker alignment reference. It is not played as an animation. The current submitted RGB sheets include pale backgrounds, so the fighter shader removes pale neutral pixels at runtime. Transparent PNG sheets remain preferred for future revisions.

`fighter-2/anchor.png` is the Crimson Riot portrait reference. Both bundled fighters are selectable for either player from the sprite-only character select screen.
