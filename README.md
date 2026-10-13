# <img src="public/favicon.svg" alt="" width="32" align="top"> Doodles

A doodle page idea generator for sketchbooks. Roll a style, a color palette and a motif, and get a sketch drawn on the fly to use as a starting point.

**Live demo:** [doodles](https://doodlesapp.pages.dev/)

![Doodles demo: rolling pages, picking the Tarsila style and palette, turning outlines off and on, switching to Van Gogh and changing the language](docs/media/demo.gif)

## Why

I use art as therapy, and some days I don't want to spend energy deciding what to draw. Doodles gives me a reference of colors and shapes to borrow from, so I can just sit down and draw.

## Features

- **29 styles**: op art, pop art, groovy checkerboards, 3D lines, flower tiles, rug patterns and styles inspired by artists like Tarsila do Amaral, Volpi, Van Gogh, Matisse and Kusama
- **47 color palettes**, including artist palettes, each one shown as a set of markers next to the page
- **Procedural SVG sketches**: every roll draws a new page from a seeded random generator, with no image assets
- **Lock or pick**: keep the style or the palette you like and roll only the rest
- **Outlines on or off**: outlines use the palette's dark tone, never black
- **Adaptive theme**: the interface colors follow the current palette
- **Keyboard friendly**: press `Space` to roll
- **Bilingual**: Portuguese and English, detected from the browser language

| Tarsila landscape · Tarsila do Amaral | Van Gogh sky · Van Gogh | Kusama dots · Yayoi Kusama |
| --- | --- | --- |
| ![Tarsila landscape style with the Tarsila do Amaral palette: round hills, trees and a cactus](docs/media/screenshot-tarsila.png) | ![Van Gogh sky style with the Van Gogh palette: swirling brushstrokes, stars and a cypress](docs/media/screenshot-vangogh.png) | ![Kusama dots style with the Yayoi Kusama palette: a dotted pumpkin on a polka dot background](docs/media/screenshot-kusama.png) |

## Tech stack

- [Svelte 5](https://svelte.dev) (runes)
- TypeScript
- [Vite](https://vite.dev)
- Plain CSS with custom properties and `color-mix()`

## Getting started

```bash
npm install
npm run dev
```

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the dev server                |
| `npm run build`   | Build the static site into `dist/`  |
| `npm run preview` | Serve the `dist/` build locally     |
| `npm run check`   | Run type checking with svelte-check |

## Project structure

```
src/
├── components/   UI components (picker, notepad, markers, page flip)
└── lib/
    ├── art/      SVG drawing engine and one renderer per style
    ├── data/     Style catalog, palettes and motifs
    └── ...       Generator, seeded random, geometry, i18n, theme
```

## License

[MIT](LICENSE). Developed by [icka.dev](https://icka.dev).
