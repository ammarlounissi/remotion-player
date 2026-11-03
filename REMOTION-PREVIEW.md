# Remotion Player preview project

This is a standalone Next.js preview app with the Remotion book Composition integrated. The original uploaded archives were not modified.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The page autoplays the Composition, loops it, and hides Player controls.

## Assets

The Remotion archive did not include its original book images, music, or Cairo font. `public/book-assets/page-01.svg` through `page-14.svg` are placeholders so the preview has local assets immediately. Replace them with the actual page images while preserving these filenames, or update the `images` list in `app/page.tsx`. Add the font file at `public/fonts/Cairo-Bold.ttf`; until then the title falls back to a system sans-serif font. Music is intentionally disabled (`music: null`).

## Integration details

Only the `book` Composition source files were copied. Its template metadata loader and Remotion Studio registry are not needed by the Player page. Remotion package versions are pinned to 4.0.539.
