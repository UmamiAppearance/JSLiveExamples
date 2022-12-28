import { test } from "no-bro-cote";

test.htmlPage = "./test/fixtures/test.html";
test.addImport("import liveExamples from './dist/js-live-examples.esm.js';");

//const eventPromise = (elem, e) => new Promise(resolve => elem.addEventListener(e, resolve, {once: true}));


test.makeUnit(
    "node creation",
    true,
    () => {
        window.examples = document.querySelectorAll("div.live-example");

        return Boolean(window.examples[0]);
    }
);

test.makeUnit(
    "node contains 3 children",
    3,
    () => window.examples[0].childNodes.length,
);

test.makeUnit(
    "titles are correctly set",
    true,
    () => {
        const h1_0 = window.examples[0].querySelector("h1");
        
        if (h1_0.textContent === "H1") {
            const h1_1 = window.examples[1].querySelector("h1");
            return (h1_1.textContent === "Example #2");
        }

        return false;
    }
);

test.makeUnit(
    "custom id is set",
    "my-id",
    () => window.examples[0].id
);

test.makeUnit(
    "contodo node is present",
    true,
    () => {
        const contodo = window.examples[0].querySelector(".contodo");
        return Boolean(contodo);
    }
);

test.makeUnit(
    "contodo contains two buttons",
    2,
    () => {
        const buttons = window.examples[0].querySelectorAll("button");
        return buttons.length;
    }
);

test.makeUnit(
    "clicking run button // expecting log output",
    "Hello World!",
    () => {
        const runButton = window.examples[0].querySelector(".executeBtn");
        runButton.click();

        const contodo = window.examples[0].querySelector(".contodo");
        const log = contodo.querySelector(".log");
        if (!log) {
            return false;
        }

        return log.textContent;
    }
);

test.makeUnit(
    "auto run example was executed.",
    "yes",
    () => {

        const contodo = window.examples[1].querySelector(".contodo");
        const log = contodo.querySelector(".log");
        
        if (!log) {
            return false;
        }

        return log.textContent;
    }
);

test.makeUnit(
    "reset an example.",
    null,
    async () => {
        const resetButton = window.examples[1].querySelector(".resetBtn");
        resetButton.click();

        const contodo = window.examples[1].querySelector(".contodo");
        const log = contodo.querySelector(".log");
        return log;
    }
);



test.init();
