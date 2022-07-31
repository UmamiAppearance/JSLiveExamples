import "../lib/prism.js";
import { CodeJar } from "../lib/codejar.js";
import ConTodo from "../lib/contodo.js";
import { contodoCSS, prismCSS } from "./css.js";

const css = contodoCSS + prismCSS;

class LiveExample {
    
    constructor(node, index) {
        const title = this.getTitle(node, index);
        const code = this.getCode(node);
        const example = this.makeCodeExample(title, code);

        node.parentNode.append(example);
    }

    getTitle(node, index) {
        const titleNode = node.content.querySelector("h1");
        let title;
        if (!titleNode) {
            title = `Example #${index}`;
        } else {
            title = titleNode.textContent;
        }
        return title;
    }

    getCode(node) {
        
        const codeNode = node.content.querySelector("script");
        
        if (!codeNode) {
            throw new TypeError("Every template needs a script tag with the code to display.")
        }
        
        let code = codeNode.innerHTML;
        const pattern = code.match(/\s*\n[\t\s]*/);
        code = code.replace(new RegExp(pattern, "g"), "\n");
        
        return code.trim();
    };


    makeCodeExample(title, code) { 

        // create new html nodes
        const main = document.createElement("div");
        main.className = "live-example"
        //main.setAttribute.code = code;

        const codeNode = document.createElement("code");
              codeNode.className = "language-js code";
              codeNode.style.display = "block";
              codeNode.style.borderRadius = "0.5em 0.5em 0 0";
        

        const titleWrapper = document.createElement("div");
              titleWrapper.className = "title-wrapper";
        
        const titleNode = document.createElement("h1");
              titleNode.append(document.createTextNode(title));


        const controlsWrapper = document.createElement("div");
              controlsWrapper.className = "controls";
              
        const resetBtn = document.createElement("button");
              resetBtn.append(document.createTextNode("reset"));
              resetBtn.addEventListener("click", () => { jar.updateCode(code); }, false);

        const executeBtn = document.createElement("button");
              executeBtn.append(document.createTextNode("run"));

        // initialize jar instance
        const jar = CodeJar(codeNode, (editor) => { Prism.highlightElement(editor); } , {
            tab: " ".repeat(4),
        });
        jar.updateCode(code);
        
        
        // append nodes to document section
        main.append(codeNode);

        titleWrapper.append(titleNode);
        titleWrapper.append(controlsWrapper);
        controlsWrapper.append(resetBtn);
        controlsWrapper.append(executeBtn);
        main.append(titleWrapper);

        const contodo = new ConTodo(
            main,
            {
                autostart: false,
                catchErrors: true,
                height: "160px",
                preventDefault: true,
                reversed: true
            }
        );

        contodo.createDocumentNode();

        executeBtn.addEventListener("click", () => {
            contodo.initFunctions();
            eval(jar.toString());
            contodo.restoreDefaultConsole();
        }, false);

        return main;
    };
}

const liveExamples = (() => {

    console.log();
    const style= document.createElement("style"); 
    style.innerHTML = css;
    document.head.append(style);

    const applyNodes = () => {
        const nodes = document.querySelectorAll("template.live-example");
        let i = 0;
        for (const node of nodes) {
            new LiveExample(node, i++);
        }
    }

    if (document.readyState === "complete") {
        applyNodes();
    } else {
        document.addEventListener("DOMContentLoaded", applyNodes, false);
    }
    
})()

export default liveExamples;
