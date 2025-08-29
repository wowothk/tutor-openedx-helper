import { babel } from "@rollup/plugin-babel";

export default [
  // CommonJS build
  {
    input: "src/index.js",
    output: {
      file: "dist/index.cjs.js",
      format: "cjs",
    },
    external: ["react", "react-dom", "@openedx/paragon", "react-markdown"],
    plugins: [
      babel({
        exclude: "node_modules/**",
        presets: ["@babel/preset-react"],
        babelHelpers: 'bundled'
      })
    ]
  },
  // ES Module build
  {
    input: "src/index.js",
    output: {
      file: "dist/index.esm.js",
      format: "esm",
    },
    external: ["react", "react-dom", "@openedx/paragon", "react-markdown"],
    plugins: [
      babel({
        exclude: "node_modules/**",
        presets: ["@babel/preset-react"],
        babelHelpers: 'bundled'
      })
    ]
  }
];
