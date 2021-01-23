# https://rollupjs.org/guide/en/
rollup runtime.js --name runtime --format iife --silent | terser -cm -o runtime.min.js
rollup main.js --name main --format iife --silent | terser -cm -o main.min.js
# cp -Rf images/ docs/images
# cp -Rf style/ docs/style
# cp -f manifest.webmanifest docs/
