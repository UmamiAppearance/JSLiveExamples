const RUNNER_FUNCTION_NAME = "liveExampleCodeRunner";

const AsyncFunction = (async function () {}).constructor;

const randID = () => `p_${Math.random().toString(16).slice(2)}`;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

window.waitPromise = name => {
    return new Promise(resolve => {
        const resolveFn = () => {
            window.removeEventListener(name, resolveFn, false);
            resolve();
        };
        window.addEventListener(name, resolveFn, false);
    });
    // TODO: eventually add timeout/reject
};


const makeTypingFN = (code) => {

    const chars = [...code];
    
    const fn = async jar => {
        let content = jar.toString();
        
        for (const char of chars) {
            content += char;
            jar.updateCode(content);
            await sleep(Math.floor(Math.random() * 70 + 40));
        }     
    };

    return fn;
};

const makeDemo = async (id, code, jar, contodo) => {
    const instanceId = randID();
    window[instanceId] = new Event(instanceId);
    
    const regex = /^_{3}(?:\([0-9]+\))?.*\r?\n?/gm;
    const codeUnits = code.split(regex);
    const breakpoints = code.match(regex)
        .map(bp => Number(bp.replace(/[^0-9]/g, "")));
    breakpoints.push(0);
    
    let codeInstructions = `const sleep = ${sleep.toString()};\n`;
    //codeInstructions += `const instanceId = ${instanceId}\n`;
    codeInstructions += `await waitPromise("${instanceId}");\n`;
    const typingInstructions = [];

    codeUnits.forEach((codeUnit, i) => {

        const typingFN = makeTypingFN(codeUnit);

        typingInstructions.push(typingFN);
        typingInstructions.push(() => window.dispatchEvent(window[instanceId]));
        typingInstructions.push(async () => await window.waitPromise(instanceId));

        codeInstructions += codeUnit; 
        codeInstructions += `await sleep(${breakpoints[i]+10});\n`;
        codeInstructions += `window.dispatchEvent(window.${instanceId})\n`;
        codeInstructions += `await waitPromise("${instanceId}")\n`;
        
    });

    console.log(codeInstructions);
    console.log(typingInstructions);
    contodo.clear(false);
    contodo.initFunctions();
    
    try {
        (async () => {
            for (const fn of typingInstructions) {
                //console.log(fn);
                await fn(jar);
            }
        })();
        const fn = new AsyncFunction(codeInstructions);
        await fn();
    } catch (err) {
        throwError(err, id);
    }
    // TODO: dispatch one more time at the end
    console.log("doone");
    contodo.restoreDefaultConsole();
    //jar.updateCode("");
};


/**
 * Adjusts the information from an error stack.
 * @param {Object} error - Error object. 
 * @returns {string} - Stack string.
 */
const errorStackExtractor = (error, id) => {

    const stackArray = error.stack.split("\n");
    
    // remove irrelevant stack information deeper down
    let part;
    do {
        part = stackArray.pop();
    }
    while (typeof part !== "undefined" && !part.includes(RUNNER_FUNCTION_NAME));

    // remove redundant error name and description (chrome)
    const redundancyReg = new RegExp(`^${error.name}`);
    if (stackArray.length && redundancyReg.test(stackArray[0])) {
        stackArray.shift();
    }

    if (stackArray.length) {
        
        const buildStackElem = (fn, line, col) => {
            line -=2;
            if (line < 0) {
                return null;
            }
            
            return `  > ${fn}@${id}, line: ${line}, col: ${col}`;
        };

        // chrome & edge
        if ((/\s*at\s/).test(stackArray[0])) {
            stackArray.forEach((elem, i) => {
                const fn = elem.match(/(?:^\s*at )(\w+)/)[1];
                let [ line, col ] = elem.split(":")
                    .slice(-2)
                    .map(n => n.replace(/\D/g, "")|0);
                
                stackArray[i] = buildStackElem(fn, line, col);
            });
        } 
        
        // firefox
        else if ((/^\w+@/).test(stackArray[0])) {
            stackArray.forEach((elem, i) => {
                const fn = elem.split("@")[0];
                let [ line, col ] = elem.split(":")
                    .slice(-2)
                    .map(n => n.replace(/\D/g, "")|0);
                
                stackArray[i] = buildStackElem(fn, line, col);
            });
        }

        let stackStr = "";
        stackArray.forEach(elem => {
            if (elem) {
                stackStr += elem + "\n";
            }
        });

        return stackStr;
    }
    
    return null;
};

const throwError = (err, id) => {
    let msg = `${err.name}: ${err.message}`;
    const stack = errorStackExtractor(err, id);
    if (stack) {
        msg += "\n" + stack;
    }
    console.error(msg);
};


export {
    RUNNER_FUNCTION_NAME,
    AsyncFunction,
    throwError,
    makeDemo
};
