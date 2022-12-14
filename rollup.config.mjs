import { importManager } from "rollup-plugin-import-manager";
import { yourFunction } from "rollup-plugin-your-function";
import CleanCSS from "clean-css";
import terser from "@rollup/plugin-terser";


const output = (subDir="", appendix="") => [
    {   
        format: "iife",
        name: "liveExamples",
        file: `./dist/${subDir}js-live-examples${appendix}.iife.js`
    },
    {   
        format: "iife",
        name: "liveExamples",
        file: `./dist/${subDir}js-live-examples${appendix}.iife.min.js`,
        plugins: [terser()]
    },
    {   
        format: "es",
        name: "liveExamples",
        file: `./dist/${subDir}js-live-examples${appendix}.esm.js`
    },
    {   
        format: "es",
        name: "liveExamples",
        file: `./dist/${subDir}js-live-examples${appendix}.esm.min.js`,
        plugins: [terser()]
    },
];

const cssImport = `
import mainCSS from "../css/main.css";
import prismCSS from "../css/prism.css";
`;

const nullImport = `
const mainCSS = "";
const prismCSS = "";
`;

const exports = [
    {
        input: "./src/live-examples.js",
        output: output(),
        plugins: [
            yourFunction({
                include: "**/*.css",
                fn: source => {
                    const output = new CleanCSS({}).minify(source);
                    return `export default ${JSON.stringify(output.styles)}`;
                },
            }),
            importManager({
                units: {
                    file: "**/live-examples.js",
                    addCode: cssImport,
                    replace: {
                        module: "css.js"
                    }
                }
            })
        ]
    },
    {
        input: "./src/live-examples.js",
        output: output("no-style/", "-no-style"),
        plugins: [
            importManager({
                units: {
                    file: "**/live-examples.js",
                    addCode: nullImport,
                    replace: {
                        module: "css.js"
                    }
                }
            })
        ]
    }
];

export default exports;
