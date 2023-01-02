import { test } from "no-bro-cote";

test.htmlPage = "./test/fixtures/auto-demo.html";
test.addImport("import liveExamples from './dist/js-live-examples.esm.js';");

//const eventPromise = (elem, e) => new Promise(resolve => elem.addEventListener(e, resolve, {once: true}));

test.makeUnit(
    "demo with 'run-attribute' is running",
    true,
    () => {
        window.demo = document.querySelector("div.live-example");
        
        if (!window.demo.classList.contains("processing")) {
            return false;
        }
        
        window.demo.stopDemo();

        return true;
    }
);

test.init();
