import { link } from "fs";
    
link("./node_modules/contodo/themes/default.css", "./css/contodo.css", (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("\nHard link created\n");
    }
});
