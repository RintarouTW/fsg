# Fast SVG Geometry Builder (FSG)

Create animatable, customizable, re-editable and light weight interactive geometry for the web.

## Features

- Extremely fast and light weight geometry construction.
- Hot keys based geometry construction
- Save as Draggable, Selectable, Animatable, Re-editable and Reusable light weight SVG.
- User interactive with the created geometry, not only a static image.
- .svg could be animated with your user script.
- Edit and execute your animate script within the builder.
- Runtime supports multiple .svg instances in a single page (fast and light weight).
- LaTeX support.
- Color styles druing the construction or customize with CSS.
- PWA support, you can easily turn the web builder to your local application.
- Export to .html (Inline SVG)

## Code Structure

- common/ : shared definition and helpers.
- components/ : FSG components that managed the svgjs elements within the canvas.
- modules/ : support multiple canvases in a single page. mostly for editor modules.
- rollup.sh : use rollup and terser to bundle and minify the editor and runtime code to release.
- main.js : the editor's main function.
- runtime.js : the runtime's main function.
- manifest.webmanifest : support for PWA.
- index.html : KaTeX, SVGJS, iro are loaded from CDN.
- dev.html : For Local Development.

## Dependency

- SVGJS for SVG elements
- svgjs.pan.zoom plugin for pan and zoom (it's minor modified for the builder)
- KaTeX for LaTeX rendering
- CodeMirror for code editing
- iro for color picker
- (npm) rollup for js code bundler
- (npm) terser for minify code

## Why?

I enjoyed Geogebra for a long time, but it's too heavy and slow when embedding multiple instances in a single page.
The runtime of Geogebra is not designed for the web, that makes your work hard to be reused in the web pages.
At the same time, it's kind of too complex for people who is not major in Math.
So I decided to build this builder that I can create the geometry I want in just one minute.
