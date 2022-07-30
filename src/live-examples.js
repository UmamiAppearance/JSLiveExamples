import "../lib/prism.js";
import { CodeJar } from "../lib/codejar.js";
import ConTodo from "../lib/contodo.js";


class LiveExample {
    
    constructor(node) {
        const code = this.getCode(node).trim();
        const example = this.makeCodeExample(code);

        node.parentNode.append(example);


    }

    getCode(node) {
        const codeNode = node.content.querySelector("script");
        if (!codeNode) {
            throw new TypeError("Every template needs a script tag with the code to display.")
        }
        return codeNode.innerHTML;
    };

    runCode = (code) => {
        const HTMLConsole = document.querySelector("#console");
        eval(code);
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

    import("./css.js").then(css => {
        const style= document.createElement("style"); 
        style.innerHTML = css.css;
        document.head.append(style);
    });
    
    document.addEventListener("DOMContentLoaded", () => {   

        const nodes = document.querySelectorAll("template.live-example");
        for (const node of nodes) {
            new LiveExample(node);
        }
    
    }, false)
})()

export default liveExamples;
