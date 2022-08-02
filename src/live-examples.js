import "../lib/prism.js";
import { CodeJar } from "../lib/codejar.js";
import ConTodo from "../lib/contodo.js";
import { mainCSS, prismCSS } from "./css.js";

const css = mainCSS + prismCSS;

class LiveExample {
    
    constructor(node, index, options) {
        const id = node.getAttribute("for") || `live-example-${index+1}`;
        const className = node.getAttribute("class");

        const title = this.getTitle(node, index);
        const code = this.getCode(node);
        if (!code) {
            return null;
        }
        
        const example = this.makeCodeExample(title, code);
        example.id = id;
        example.className = className;

        node.parentNode.insertBefore(example, node);
    }

    getTitle(node, index) {
        const titleNode = node.content.querySelector("h1");
        let title;
        if (!titleNode) {
            title = `Example #${index+1}`;
        } else {
            title = titleNode.textContent;
        }
        return title;
    }

    getCode(node) {
        
        const codeNode = node.content.querySelector("script");
        if (!codeNode) {
            console.warn("Every template needs a script tag with the code to display.");
            return null;
        }
        
        let code = codeNode.innerHTML;
        const pattern = code.match(/\s*\n[\t\s]*/);
        code = code.replace(new RegExp(pattern, "g"), "\n");

        this.evaluate = codeNode.getAttribute("type") === "eval";

        return code.trim();
    };

    makeLineFN(ln) {

        let storedLines = 0;
        
        const updateLines = (code) => {
            const lines = code.split("\n").length;
            if (lines !== storedLines) {
                while (lines < storedLines) {
                    ln.childNodes[lines-1].remove();
                    storedLines --;
                }
                while (lines > storedLines) {
                    ln.append(document.createElement("li"));
                    storedLines ++;
                }
            }
        }

        return updateLines;
    }

    makeToClipboardFN() {
        const toClipboard = (e) => {
            const code = e.target.previousSibling.textContent;
            window.navigator.clipboard.writeText(code);

            const copied = document.querySelector("#le-copied");
            copied.classList.add("show");
            
            setTimeout(() => {
                copied.classList.remove("show");
            }, 1500)
        }
        return toClipboard;
    }

    makeEvalFN() {
        if (this.evaluate) {
            return code => eval(code);
        } else {
            return code => new Function(code)();
        }
    }
    

    makeCodeExample(title, code) { 

        // create new html nodes
        const main = document.createElement("div");

        const codeWrapper = document.createElement("div");
        codeWrapper.className = "code";

        const lineNumbers = document.createElement("ol");
        
        const codeNode = document.createElement("code");
        codeNode.className = "language-js";

        const copyBtn = document.createElement("div");
        copyBtn.className = "copy";
        copyBtn.title = "copy to clipboard";
        const toClipboard = this.makeToClipboardFN();
        copyBtn.addEventListener("click", toClipboard, false);

        codeWrapper.append(lineNumbers);
        codeWrapper.append(codeNode);
        codeWrapper.append(copyBtn);
            

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
        const updateLines = this.makeLineFN(lineNumbers);
        const jar = CodeJar(codeNode, (editor) => { Prism.highlightElement(editor); } , {
            tab: " ".repeat(4),
        });

        jar.onUpdate(updateLines);
        updateLines(code);
        jar.updateCode(code);
        
        
        // append nodes to document section
        main.append(codeWrapper);
        main.append(titleWrapper);

        const contodo = new ConTodo(
            main,
            {
                autostart: false,
                catchErrors: true,
                height: "160px",
                preventDefault: true
            }
        );

        contodo.createDocumentNode();
        const evalFN = this.makeEvalFN();
        
        // button methods
        resetBtn.addEventListener("click", () => {
            contodo.clear(false);
            jar.updateCode(code);
            updateLines(code);
        }, false);
        executeBtn.addEventListener("click", () => {
            contodo.clear(false);
            contodo.initFunctions();
            evalFN(jar.toString());
            contodo.restoreDefaultConsole();
        }, false);

        return main;
    };
}

const liveExamples = (() => {

    if (css) {
        const style= document.createElement("style"); 
        style.innerHTML = css;
        document.head.append(style);
    }

    const applyNodes = () => {
        const nodes = document.querySelectorAll("template.live-example");
        let i = 0;
        for (const node of nodes) {
            new LiveExample(node, i++);
        }

        const copiedInfo = document.createElement("section");
        copiedInfo.id = "le-copied";

        const copiedInfoText = document.createElement("article");
        copiedInfoText.textContent = "copied to clipboard";

        copiedInfo.append(copiedInfoText);
        document.body.append(copiedInfo);
    }

    if (document.readyState === "complete") {
        applyNodes();
    } else {
        document.addEventListener("DOMContentLoaded", applyNodes, false);
    }
    
})()

export default liveExamples;
