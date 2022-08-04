import { symlink } from "fs";

const linkLib = (file, link) => {
    symlink(file, link, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Symlink created: '${file}' <- '${link}'`);
        }
    });
}

linkLib(
    "../node_modules/codejar/codejar.js",
    "./lib/codejar.js"
);

linkLib(
    "../node_modules/contodo/dist/no-style/contodo-no-style.esm.js",
    "./lib/contodo.js"
);

// An automatic build for 'Prism.js' is not available.
// You can download it here:
// https://prismjs.com/download.html#themes=prism&languages=clike+javascript

