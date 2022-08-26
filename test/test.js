import { test } from "no-bro-cote";

test.htmlPage = "./test/fixtures/test.html";
test.addImport("import liveExamples from './dist/js-live-examples.esm.js';");

test.makeUnit(
    "functionality",
    true,
    () => {
        const example1Node = document.querySelector("#live-example-1");

        console.log("Test if node was created.");
        if (!example1Node) {
            console.log("FAILED");
            return false;
        }

        console.log("Test if contains 3 children.");
        if (example1Node.childNodes.length !== 3) {
            console.log(`FAILED - children length is ${example1Node.childNodes.length}`);
            return false;
        }

        console.log("Test if contodo node is present.");
        const contodo = example1Node.querySelector(".contodo");
        if (!contodo) {
            console.log("FAILED");
            return false;
        }

        console.log("Test if contodo contains two buttons.");
        const buttons = example1Node.querySelectorAll("button");
        if (buttons.length !== 2) {
            console.log(`FAILED - button length is ${buttons.length}`);
            return false;
        }
        
        console.log("Clicking run button!");
        const runButton = buttons[1];
        runButton.click();

        console.log("Test if log was created.");
        const log = contodo.querySelector(".log");
        if (!log) {
            console.log("FAILED");
            return false;
        }

        console.log("Asserting log content.");
        return (log.textContent === "Hello World!");
    }
);

test.init();
