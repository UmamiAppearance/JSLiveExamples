import "../lib/prism.js";
import { CodeJar } from "../lib/codejar.js";
import ConTodo from "../lib/contodo.js";
import { contodoCSS, prismCSS } from "./css.js";

const css = contodoCSS + prismCSS;

class LiveExample {
    
    constructor(node) {
        const code = this.getCode(node);
        const example = this.makeCodeExample(code);

        node.parentNode.append(example);
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


    makeCodeExample(code) { 

        // create new html nodes
        const main = document.createElement("div");
        //main.setAttribute.code = code;

        const codeNode = document.createElement("code");
              codeNode.className = "language-js";
              codeNode.style.display = "block";
        
        const resetBtn = document.createElement("button");
              resetBtn.appendChild(document.createTextNode("reset"));
              resetBtn.addEventListener("click", () => { jar.updateCode(code); }, false);

        const executeBtn = document.createElement("button");
              executeBtn.appendChild(document.createTextNode("run"));
              executeBtn.addEventListener("click", () => { eval(jar.toString()); }, false);

        // initialize jar instance
        const jar = CodeJar(codeNode, (editor) => { Prism.highlightElement(editor); } , {
            tab: " ".repeat(4),
        });
        jar.updateCode(code);
        
        
        // append nodes to document section
        main.appendChild(codeNode);
        main.appendChild(resetBtn);
        main.appendChild(executeBtn);

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
        for (const node of nodes) {
            new LiveExample(node);
        }
    }

    if (document.readyState === "complete") {
        applyNodes();
    } else {
        document.addEventListener("DOMContentLoaded", applyNodes, false);
    }
    
})()

export default liveExamples;
