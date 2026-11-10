# FLWR-Inspired Neutral Color Palette

A neutral, low-saturation UI palette extracted from the supplied
reference image. Use these tokens as the shared source of truth when
implementing the interface.

## Color tokens

  ----------------------------------------------------------------------------------------
  Token                    Name                      Hex               RGB Suggested role
  ------------------------ ------------ ---------------- ----------------- ---------------
  `--color-emptiness`      Emptiness           `#FCFCFB`   `252, 252, 251` Main page
                                                                           background,
                                                                           bright surfaces

  `--color-night-white`    Night White         `#E1E0DE`   `225, 224, 222` Subtle surface
                                                                           contrast,
                                                                           disabled
                                                                           backgrounds

  `--color-spotted-dove`   Spotted Dove        `#C0BFBD`   `192, 191, 189` Borders,
                                                                           dividers, muted
                                                                           UI elements

  `--color-stone-haze`     Stone Haze          `#95898B`   `149, 137, 139` Secondary
                                                                           accents,
                                                                           subdued
                                                                           emphasis

  `--color-iron-fixture`   Iron Fixture        `#5F5B5D`      `95, 91, 93` Secondary text,
                                                                           icons, subdued
                                                                           controls

  `--color-caviar`         Caviar              `#2A2D31`      `42, 45, 49` Primary text,
                                                                           dark surfaces,
                                                                           high-contrast
                                                                           elements
  ----------------------------------------------------------------------------------------

## CSS custom properties

``` css
:root {
  --color-emptiness: #FCFCFB;
  --color-night-white: #E1E0DE;
  --color-spotted-dove: #C0BFBD;
  --color-stone-haze: #95898B;
  --color-iron-fixture: #5F5B5D;
  --color-caviar: #2A2D31;

  /* Suggested semantic aliases */
  --background: var(--color-emptiness);
  --surface: var(--color-emptiness);
  --surface-subtle: var(--color-night-white);
  --border: var(--color-spotted-dove);
  --text-primary: var(--color-caviar);
  --text-secondary: var(--color-iron-fixture);
  --accent-muted: var(--color-stone-haze);
}
```

## Tailwind theme reference

For projects using Tailwind, map the palette into the project's existing
theme configuration rather than introducing a second, competing color
system.

``` js
const palette = {
  emptiness: "#FCFCFB",
  "night-white": "#E1E0DE",
  "spotted-dove": "#C0BFBD",
  "stone-haze": "#95898B",
  "iron-fixture": "#5F5B5D",
  caviar: "#2A2D31",
};
```

## Usage guidance for coding agents

1.  **Preserve the neutral visual identity.** Prefer these six colors
    for the interface's base surfaces, typography, borders, and
    restrained accents.
2.  **Use `#FCFCFB` as the default canvas.** Keep the overall page light
    and spacious.
3.  **Use `#2A2D31` for primary text.** Use `#5F5B5D` for secondary text
    and supporting icons.
4.  **Use `#E1E0DE` and `#C0BFBD` for structure.** Apply them to subtle
    surface differences, separators, outlines, and inactive states.
5.  **Use `#95898B` sparingly.** It is a muted accent, not a replacement
    for the primary text color.
6.  **Do not invent additional brand colors.** If a functional state
    requires color (success, warning, error, focus), use the project's
    established accessible state tokens; otherwise keep the treatment
    neutral.
7.  **Check contrast.** Do not assume every palette pairing is
    accessible. In particular, avoid placing small text in muted tones
    on similarly muted backgrounds. Verify text and interactive-state
    contrast against WCAG requirements.
8.  **Keep tokens centralized.** Reference the variables/theme values
    throughout components; avoid scattering raw hex values across the
    codebase.

## Implementation note

The semantic roles above are recommendations inferred from the reference
palette, not additional colors or definitive design-system rules. The
six hex values are the source palette; preserve them exactly.
