/**
 * [JSLiveExamples]{@link https://github.com/UmamiAppearance/JSLiveExamples}
 *
 * @version 0.4.0
 * @author UmamiAppearance [mail@umamiappearance.eu]
 * @license GPL-3.0
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
        const { code, autostart, demo } = this.getCode(template);
        
        const example = this.makeCodeExample(title, code, demo);
        example.id = this.id;
        example.className = className;
        example.autostart = autostart;
        example.demo = demo;

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
     * Extracts the code from given a <script> - tag
     * from the <template> node.
     * @param {object} template - A html "<template>" node. 
     * @returns {string} - The code as a string.
     */
    getCode(template) {
        
        let code = "";
        let autostart = false;
        let demo = false;

        const codeNode = template.content.querySelector("script");
        
        if (codeNode) {
            code = codeNode.innerHTML;
            const pattern = code.match(/\s*\n[\t\s]*/);
            code = code
                .replace(new RegExp(pattern, "g"), "\n")
                .trim();
            
            autostart = Boolean(codeNode.dataset.run);
            demo = Boolean(codeNode.dataset.demo);
        }
        
        return { code, autostart, demo };
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
    makeCodeExample(title, code, isDemo) { 

        // create new html node
        const main = document.createElement("div");
        window.M = main;


        // the code part
        const codeWrapper = document.createElement("div");
        codeWrapper.className = "code";

        const lineNumbers = document.createElement("ol");
        
        const codeNode = document.createElement("code");
        codeNode.className = "language-js";

        const copyBtn = document.createElement("div");
        copyBtn.className = "copy";
        copyBtn.title = "copy to clipboard";
        copyBtn.addEventListener("click", this.toClipboard, false);

        codeWrapper.append(lineNumbers);
        codeWrapper.append(codeNode);
        codeWrapper.append(copyBtn);
            

        // the title and controls part
        const titleWrapper = document.createElement("div");
        titleWrapper.className = "title-wrapper";
        
        const titleNode = document.createElement("h1");
        titleNode.textContent = title;

        const controlsWrapper = document.createElement("div");
        controlsWrapper.className = "controls";

        const resetBtn = document.createElement("button");
        resetBtn.textContent = "reset";

        const executeBtn = document.createElement("button");
        executeBtn.textContent = "run";

        controlsWrapper.append(resetBtn);
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

        // test and prepare for demo mode
        if (isDemo) {      
            [   
                code,
                main.runDemo,
                main.pauseDemo,
                main.resumeDemo,
                main.stopDemo
            ] = makeDemo(this.id, code, jar, contodo);

        } else {
            jar.updateLines(code);
            jar.updateCode(code);
        }

        
        const resetFN = () => {
            contodo.clear(false);
            jar.updateCode(code);
            jar.updateLines(code);
        };

        // establish button methods
        resetBtn.addEventListener("click", resetFN, false);
        main.reset = resetFN;


        // this is a regular async fn, but protected
        // against renaming by eg. terser, hence the
        // weird construction (the function name must
        // be protected to get readable error messages)

        const liveExampleCodeRunner = {[RUNNER_FUNCTION_NAME]: async () => {
            contodo.clear(false);
            contodo.initFunctions();

            try {
                const fn = new AsyncFunction(jar.toString());
                await fn();
            } catch (err) {
                throwError(err, this.id);
            }
            contodo.restoreDefaultConsole();
            main.dispatchEvent(EXECUTED);       
        }}[RUNNER_FUNCTION_NAME];

        executeBtn.addEventListener("click", liveExampleCodeRunner, false);
        main.run = liveExampleCodeRunner;

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
     * every template and node for displaying the
     * information, that the code was copied to the
     * clipboard.
     */
    const applyNodes = () => {
        const templates = document.querySelectorAll("template.live-example");
        const autostartExamples = [];

        templates.forEach((template, i) => {
            const example = new LiveExample(template, i++);
            if (example && example.autostart && !example.demo) {
                autostartExamples.push(example);
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
                example.run();
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
