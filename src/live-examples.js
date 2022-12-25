/**
 * [JSLiveExamples]{@link https://github.com/UmamiAppearance/JSLiveExamples}
 *
 * @version 0.4.0
 * @author UmamiAppearance [mail@umamiappearance.eu]
 * @license MIT
 */


import "../lib/prism.js";
import { CodeJar } from "../lib/codejar.js";
import ConTodo from "../lib/contodo.js";
import { mainCSS, prismCSS } from "./css.js";
import {
    RUNNER_FUNCTION_NAME,
    AsyncFunction,
    makeDemo,
    throwError 
} from "./utils.js";


const CSS = mainCSS + prismCSS;
const EXECUTED = new Event("executed");
const STOPPED = new Event("stopped");


/**
 * Constructor for an instance of a LiveExample.
 * It converts a template into a document node
 * and attaches it to the document.
 */
class LiveExample {
    
    /**
     * Contains all steps for the node creation and
     * insertion into the page.
     * @param {object} template - A html <template> node.
     * @param {number} index - Index of the node for one document.
     */
    constructor(template, index) {

        // if the template has the attribute "for"
        // it is used for the id of instance
        this.id = template.getAttribute("for") || `live-example-${index+1}`;
        const className = template.getAttribute("class");

        const title = this.getTitle(template, index);
        const { code, options } = this.getAttributes(template);
        
        const example = this.makeCodeExample(title, code, options);
        example.id = this.id;
        example.autostart = options.autostart;
        example.demo = options.demo;

        example.classList.add(className);
        if (!options.buttons) example.classList.add("no-buttons");
        if (!options.scroll) example.classList.add("no-scroll");

        
        // insert the fresh node right before the
        // template node in the document
        template.parentNode.insertBefore(example, template);

        return example;
    }

    
    /**
     * Extracts a title from the template node
     * if present, otherwise generates a generic
     * title from the index (Example #<index+1>)
     * @param {object} template - A html "<template>" node.
     * @param {number} index - Index of the node for one document.
     * @returns {string} - Title.
     */
    getTitle(template, index) {
        const titleNode = template.content.querySelector("h1");
        let title;
        if (!titleNode) {
            title = `Example #${index+1}`;
        } else {
            title = titleNode.textContent;
        }
        return title;
    }


    /**
     * Extracts the code and other attributes from a given
     * <script> - tag from the <template> node.
     * @param {object} template - A html "<template>" node. 
     * @returns {Object} - The extracted code and options.
     */
    getAttributes(template) {

        const getBool = (val, True=false) => {  
            const boolFromAttrStr = val => (val === "" || !(/^(?:false|no?|0)$/i).test(String(val)));
            
            if (True) {
                return typeof val === "undefined" || boolFromAttrStr(val);
            }
            return typeof val !== "undefined" && boolFromAttrStr(val);
        };
        
        const getInt = (val, fallback, min, name) => {
            if (typeof val === "undefined") {
                return fallback;
            }
        
            let n = parseInt(val, 10);
        
            if (isNaN(n) || n < min) {
                n = fallback;
                window._console.warn(`The number input for ${name} must be a positive integer greater or equal to ${min}. Using default value ${fallback}`);
            }
        
            return n;
        };
        
        
        let code = "";

        // default values
        const options = {
            autostart: false,
            buttons: true,
            demo: false,
            executionDelay: 250,
            scroll: true,
            transform: true,
            typingSpeed: 60,
            typingVariation: 80
        };


        const codeNode = template.content.querySelector("script");

        if (codeNode) {
            code = codeNode.innerHTML;
            const pattern = code.match(/\s*\n[\t\s]*/);
            code = code
                .replace(new RegExp(pattern, "g"), "\n")
                .trim();
            
            // backwards compatibility
            let autostart = getBool(codeNode.dataset.run, false);
            if (autostart) {
                console.warn("DEPRECATION NOTICE:\nPassing the run attribute directly to the script tag is deprecated. Support will be removed in a future release. Use the <meta> tag to pass this option.");
                
                options.autostart = true;

                return {
                    code,
                    options
                };
            }
        }
   
        const metaNode = template.content.querySelector("meta");
        
        if (metaNode) {
            options.autostart = getBool(metaNode.dataset.run, false);
            options.buttons = getBool(metaNode.dataset.buttons, true);
            options.demo = getBool(metaNode.dataset.demo, false);
            options.executionDelay = getInt(
                metaNode.dataset.executionDelay,
                options.executionDelay,
                0,
                "execution-delay"
            );
            options.scroll = getBool(metaNode.dataset.scroll, true);
            options.transform = getBool(metaNode.dataset.transform, true);

            const defaultTypingSpeed = options.typingSpeed;
            const defaultTypingVariation = options.typingVariation;
            
            options.typingSpeed = getInt(
                metaNode.dataset.typingSpeed,
                defaultTypingSpeed,
                1,
                "typing-speed"
            );
            options.typingVariation = getInt(
                metaNode.dataset.typingVariation,
                defaultTypingVariation,
                1,
                "typing-variation"
            );

            if (options.typingVariation/2 > options.typingSpeed) {
                options.typingSpeed = defaultTypingSpeed;
                options.typingVariation = defaultTypingVariation;

                window._console.warn(`The typing speed must as least be double as high as the variation. Falling back to default values [typing-speed: ${defaultTypingSpeed}, typing-variation: ${defaultTypingVariation}].`);
            }
        }
        
        return { code, options };
    }


    /**
     * Creates a function to update line numbers
     * for the code.
     * @param {object} lineNumNode - Parent node (an <ol>) for the line numbers.  
     * @returns {function} - Function for line number updates.
     */
    makeLineFN(lineNumNode) {

        let storedLines = 0;
        
        const updateLines = (code) => {
            const lines = code.split("\n").length;
            if (lines !== storedLines) {
                while (lines < storedLines) {
                    lineNumNode.childNodes[lines-1].remove();
                    storedLines --;
                }
                while (lines > storedLines) {
                    lineNumNode.append(document.createElement("li"));
                    storedLines ++;
                }
            }
        };

        return updateLines;
    }


    /**
     * Creates a function to copy the code to clipboard
     * and show an info node.
     * @returns {function} - To clipboard function.
     */
    toClipboard = (e) => {
        const code = e.target.previousSibling.textContent;
        window.navigator.clipboard.writeText(code);

        const copied = document.querySelector("#le-copied");

        // reset animation in case it is running 
        clearTimeout(window.copyTimer);
        copied.getAnimations().forEach(anim => {
            anim.cancel();
            anim.play();
        });

        // start animation
        copied.classList.add("show");
        window.copyTimer = setTimeout(() => {
            copied.classList.remove("show");
        }, 1500);
    };


    /**
     * Main method. Finally the whole html node
     * with all its children gets constructed. 
     * @param {string} title - Title for the instance.
     * @param {string} code - Initial code for the instance to display. 
     * @returns {object} - A document node (<div>) with all of its children.
     */
    makeCodeExample(title, code, options) { 

        // create new html node
        const main = document.createElement("div");

        // the code part
        const codeWrapper = document.createElement("div");
        codeWrapper.classList.add("code");

        const lineNumbers = document.createElement("ol");
        
        const codeNode = document.createElement("code");
        codeNode.classList.add("language-js");

        const copyBtn = document.createElement("div");
        copyBtn.classList.add("copy");
        copyBtn.title = "copy to clipboard";
        copyBtn.addEventListener("click", this.toClipboard, false);

        codeWrapper.append(lineNumbers);
        codeWrapper.append(codeNode);
        codeWrapper.append(copyBtn);
            

        // the title and controls part
        const titleWrapper = document.createElement("div");
        titleWrapper.classList.add("title-wrapper");
        
        const titleNode = document.createElement("h1");
        titleNode.textContent = title;

        const controlsWrapper = document.createElement("div");
        controlsWrapper.classList.add("controls");

        // if is a demo create demo specific buttons
        let demoBtn;
        let demoStopBtn;
        let demoPauseBtn;
        let demoResumeBtn;

        if (options.demo) {
            demoStopBtn = document.createElement("button");
            demoStopBtn.textContent = "stop";
            demoStopBtn.classList.add("stopBtn", "demo", "running", "paused");
            controlsWrapper.append(demoStopBtn);
            
            demoBtn = document.createElement("button");
            demoBtn.textContent = "demo";
            demoBtn.classList.add("demoBtn", "stopped");
            controlsWrapper.append(demoBtn);

            demoPauseBtn = document.createElement("button");
            demoPauseBtn.textContent = "pause";
            demoPauseBtn.classList.add("demoPauseBtn", "demo", "running");
            controlsWrapper.append(demoPauseBtn);

            demoResumeBtn = document.createElement("button");
            demoResumeBtn.textContent = "play";
            demoResumeBtn.classList.add("demoResumeBtn", "demo", "paused");
            controlsWrapper.append(demoResumeBtn);
        }

        // create regular buttons
        const resetBtn = document.createElement("button");
        resetBtn.textContent = "reset";
        resetBtn.classList.add("resetBtn","regular");
        controlsWrapper.append(resetBtn);

        const executeBtn = document.createElement("button");
        executeBtn.textContent = "run";
        executeBtn.classList.add("executeBtn", "regular");
        controlsWrapper.append(executeBtn);

        titleWrapper.append(titleNode);
        titleWrapper.append(controlsWrapper);



        // initialize jar instance
        const jar = CodeJar(
            codeNode,
            // eslint-disable-next-line no-undef
            editor => Prism.highlightElement(editor), {
                tab: " ".repeat(4),
            }
        );
        jar.updateLines = this.makeLineFN(lineNumbers);
        jar.onUpdate(jar.updateLines);
        Object.defineProperty(jar, "typing", {
            set(typing) {
                if (typing) {
                    main.classList.add("typing");
                } else {
                    main.classList.remove("typing");
                }
            }
        });

        window.JAR = jar;

    
        // append code and title to main
        main.append(codeWrapper);
        main.append(titleWrapper);


        // create and append the contodo part to main
        const contodo = new ConTodo(
            main,
            {
                autostart: false,
                preventDefault: true
            }
        );
        contodo.createDocumentNode();

        
        // prepare main functions for demo mode
        // or prepare for regular mode
        let runDemo;
        let stopDemo;
        let pauseDemo;
        let resumeDemo;
        
        if (options.demo) {      
            [   
                code,
                runDemo,
                pauseDemo,
                resumeDemo,
                stopDemo
            ] = makeDemo(this.id, code, jar, contodo, options);
        
            main.runDemo = () => {
                if (window.isDemoing) {
                    throw new Error("A demo is currently running. Starting was blocked.");
                }
                
                if (main.mode === "regular") {
                    setDemoMode();
                }

                startProcessing();
                main.classList.remove("stopped");
                main.classList.add("running");

                runDemo()
                    .finally(() => {
                        if (options.transform) {
                            setRegularMode();
                        }
                        main.dispatchEvent(STOPPED);

                        main.classList.remove("running");
                        main.classList.add("stopped");
                        endProcessing();
                    });
            };

            main.pauseDemo = () => {
                pauseDemo();
                main.classList.remove("running");
                main.classList.add("paused");
            };

            main.resumeDemo = () => {
                resumeDemo();
                main.classList.remove("paused");
                main.classList.add("running");
            };

            main.stopDemo = () => {
                stopDemo();
                main.classList.remove("running");
                main.classList.add("stopped");
                endProcessing();
            };

            demoBtn.addEventListener("click", main.runDemo, false);
            demoPauseBtn.addEventListener("click", main.pauseDemo, false);
            demoResumeBtn.addEventListener("click", main.resumeDemo, false);
            demoStopBtn.addEventListener("click", main.stopDemo, false);

        } else {
            jar.updateLines(code);
            jar.updateCode(code);
        }

        
        // install run and reset functions 
        main.reset = () => {
            if (window.isDemoing) {
                return;
            }
            contodo.clear(false);
            jar.updateCode(code);
            jar.updateLines(code);
        };

        // bind reset to resetBtn
        resetBtn.addEventListener("click", main.reset, false);

        // this is a regular async fn, but protected
        // against renaming by eg. terser, hence the
        // weird construction (the function name must
        // be protected to get readable error messages)

        main.run = {[RUNNER_FUNCTION_NAME]: async () => {
            if (window.isDemoing) {
                return;
            }

            startProcessing();

            contodo.clear(false);
            contodo.initFunctions();

            try {
                const fn = new AsyncFunction(jar.toString());
                await fn();
            } catch (err) {
                throwError(err, this.id);
            }
            contodo.restoreDefaultConsole();
            endProcessing();       
        }}[RUNNER_FUNCTION_NAME];

        // bind code execution to executeBtn
        executeBtn.addEventListener("click", main.run, false);


        // establish some helper functions
        const setDemoMode = (initial=false) => {
            main.mode = "demo";
            main.classList.add(
                "demo",
                initial 
                    ? "waiting"
                    : "stopped"
            );
            main.classList.remove("regular");
        };

        const setRegularMode = () => {
            main.mode = "regular";
            main.classList.add("regular");
            main.classList.remove("demo", "paused", "stopped");
        };

        const startProcessing = () => {
            document.body.classList.add("example-processing");
            main.classList.add("processing");
        };

        const endProcessing = () => {
            document.body.classList.remove("example-processing");
            main.classList.remove("processing");
            main.dispatchEvent(EXECUTED);
        };

        // finally set to the requested mode
        if (options.demo) {
            setDemoMode(true);
        } else {
            setRegularMode();
        }

        return main;
    }
}


/**
 * Immediately Invoked Function to scan the
 * document for templates with the class name
 * "live-example".
 */
const liveExamples = (() => {

    // apply css to the document header (if present)
    if (CSS) {
        const style = document.createElement("style"); 
        style.innerHTML = CSS;
        document.head.append(style);
    }

    /**
     * Function to generate example instances for 
     * every template. All "autostart" instances,
     * are also executed serially from top to bottom.
     */
    const applyNodes = () => {
        const templates = document.querySelectorAll("template.live-example");
        const autostartExamples = [];

        templates.forEach((template, i) => {
            const example = new LiveExample(template, i++);

            if (!example) {
                return;
            }
        
            if (example.autostart) {
                autostartExamples.push(example);
            } else if (example.demo) {
                example.classList.add("stopped");
                example.classList.remove("waiting");
            }

        });

        const copiedInfo = document.createElement("section");
        copiedInfo.id = "le-copied";

        const copiedInfoText = document.createElement("article");
        copiedInfoText.textContent = "copied to clipboard";

        copiedInfo.append(copiedInfoText);
        document.body.append(copiedInfo);

        // make sure to run the auto run examples serially
        const autoExe = () => {
            const example = autostartExamples.shift();
            if (example) {
                example.addEventListener("executed", autoExe, false);
                if (example.demo) {
                    example.classList.add("stopped");
                    example.classList.remove("waiting");
                    example.runDemo();
                } else {
                    example.run();
                }
            }
        };
        autoExe();
    };

    // Apply the example nodes either directly or wait
    // until the DOM is ready if it wasn't already. 
    if (document.readyState === "complete") {
        applyNodes();
    } else {
        document.addEventListener("DOMContentLoaded", applyNodes, false);
    }   
})();

export default liveExamples;
