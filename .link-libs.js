import { link } from "fs";

const copyLib = (path, dest) => {
    link(path, dest, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Hard link created: '${path}' -> '${dest}'`);
        }
    });
}

copyLib(
    "./node_modules/codejar/codejar.js",
    "./lib/codejar.js"
);

copyLib(
    "./node_modules/contodo/dist/no-style/contodo-no-style.esm.js",
    "./lib/contodo.js"
);

// An automatic build for 'Prism.js' is not available.
// You can download it here:
// https://prismjs.com/download.html#themes=prism&languages=clike+javascript

