# Art Asset Drop-In Folders

These folders hold generated or final game art. The first layered street-alley stage is included.

```text
assets/
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
