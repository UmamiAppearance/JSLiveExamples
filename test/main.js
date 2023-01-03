import { test } from "no-bro-cote";

test.htmlPage = "./test/fixtures/main.html";
test.addImport("import liveExamples from './dist/js-live-examples.esm.js';");

const eventPromise = (elem, e) => new Promise(resolve => elem.addEventListener(e, resolve, {once: true}));


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
    "auto run example was executed",
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
    "reset an example",
    null,
    async () => {
        const resetButton = window.examples[1].querySelector(".resetBtn");
        resetButton.click();

        const contodo = window.examples[1].querySelector(".contodo");
        const log = contodo.querySelector(".log");
        return log;
    }
);


test.makeUnit(
    "demo mode is set if requested",
    true,
    () => window.examples[2].classList.contains("demo")
);


test.makeUnit(
    "demo example contains 6 buttons",
    6,
    () => {
        const buttons = window.examples[2].querySelectorAll("button");
        return buttons.length;
    }
);

test.makeUnit(
    "demo can be started manually",
    "demo",
    async () => {
        const example = window.examples[2];
        const demoButton = example.querySelector(".demoBtn");
        
        demoButton.click();
        await eventPromise(example, "executed");
        
        const log = example.querySelector(".log");
        if (!log) {
            return false;
        }

        return log.textContent;
    }
);

test.makeUnit(
    "demo can be paused, resumed and stopped",
    true,
    async () => {
        const example = window.examples[2];
        const demoButton = example.querySelector(".demoBtn");
        const pauseButton = example.querySelector(".demoPauseBtn");
        const resumeButton = example.querySelector(".demoResumeBtn");
        const stopButton = example.querySelector(".stopBtn");

        demoButton.click();
        if (!example.classList.contains("running")) {
            return "Demo is not running!";
        }
        
        pauseButton.click();
        if (!example.classList.contains("paused")) {
            return "Demo has not been paused!";
        }

        resumeButton.click();
        if (!example.classList.contains("running")) {
            return "Demo has not been resumed!";
        }

        stopButton.click();
        if (!example.classList.contains("stopped")) {
            return "Demo has not been stopped!";
        }

        return true;    
    }
);


test.init();
