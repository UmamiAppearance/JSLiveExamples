import { importManager } from "rollup-plugin-import-manager";
import { terser } from "rollup-plugin-terser";
import { string } from "rollup-plugin-string";
import { yourFunction } from "rollup-plugin-your-function";
import CleanCSS from "clean-css";

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

const warn = (msg) => {
    // eval is not evil in this special case,
    // no need to spam the terminal 
    if (msg.code !== "EVAL") {
        console.warn(msg);
    }
};

const exports = [
    {
        input: "./src/live-examples.js",
        output: output(),
        onwarn: warn,
        plugins: [
            yourFunction({
                include: "**/*.css",
                fn: source => {
                    const output = new CleanCSS({}).minify(source);
                    return output.styles;
                },
            }),
            string({
                include: "**/*.css",
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
        onwarn: warn,
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
