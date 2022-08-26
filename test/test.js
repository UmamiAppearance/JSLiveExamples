import { test } from "no-bro-cote";

test.htmlPage = "./test/fixtures/test.html";
test.addImport("import liveExamples from './dist/js-live-examples.esm.js';");

test.makeUnit(
    "node creation",
    true,
    () => {
        window.example1Node = document.querySelector("#live-example-1");

        return Boolean(window.example1Node);
    }
);

test.makeUnit(
    "node contains 3 children",
    3,
    () => window.example1Node.childNodes.length,
);


test.makeUnit(
    "contodo node is present",
    true,
    () => {
        window.contodo = window.example1Node.querySelector(".contodo");
        return Boolean(window.contodo);
    }
);

test.makeUnit(
    "contodo contains two buttons",
    2,
    () => {
        window.buttons = window.example1Node.querySelectorAll("button");
        return window.buttons.length;
    }
);

test.makeUnit(
    "clicking run button // expecting log output",
    "Hello World!",
    () => {
        const runButton = window.buttons[1];
        runButton.click();

        const log = window.contodo.querySelector(".log");
        if (!log) {
            return false;
        }

        return log.textContent;
    }
);

test.init();
