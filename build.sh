# https://rollupjs.org/guide/en/
## npm install -g rollup
## npm install -g @rollup/plugin-strip
# https://terser.org/
## npm install -g terser
rollup runtime.js --name runtime --format iife --silent | terser -cm -o runtime.min.js
# rollup runtime.js --name runtime --format iife --silent -p strip | terser -cm -o runtime.min.js
# rollup main.js --name main --format iife --silent | terser -cm -o main.min.js
rollup main.js --name main --format iife --silent -p strip | terser -cm -o main.min.js
