# https://rollupjs.org/guide/en/
rollup runtime.js --name runtime --format iife --silent | terser -cm -o public/runtime.min.js
rollup main.js --name main --format iife --silent | terser -cm -o public/main.min.js
cp -Rf images/ public/images
cp -Rf style/ public/style
