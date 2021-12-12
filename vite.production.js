import { defineConfig } from "vite"
const path = require('path');


export default defineConfig({
	plugins: [],
	build: {
    target: "es2015",
	  outDir: 'javascript',
    lib: {
      entry: path.resolve(__dirname, 'src/main.jsx'),
      name: 'swansong',
      fileName: (format) => 'swansong.js',
    },

	},
})