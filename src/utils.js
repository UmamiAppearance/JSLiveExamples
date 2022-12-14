const RUNNER_FUNCTION_NAME = "liveExampleCodeRunner";

const AsyncFunction = (async function () {}).constructor;

const randID = () => `P_${Math.random().toString(16).slice(2)}`;

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


window.sleep = ms => new Promise(resolve => {
    const resumeIfNotPaused = async () => {
        if (window.demoIsPaused) {
            await window.demoPause;
        }
        return resolve();
    };
    setTimeout(resumeIfNotPaused, ms);
});


window.demoPauseEvt = new Event("demoPause");

const pauseDemoFN = contodo => {
    return () => {
        if (!window.isDemoing || window.demoIsPaused) {
            return;
        }
        contodo.restoreDefaultConsole();
        window.demoPause = window.waitPromise("demoPause");
        window.demoIsPaused = true;
    };
};
const resumeDemoFN = contodo => {
    return () => {
        if (!window.isDemoing || !window.demoIsPaused) {
            return;
        }
        contodo.initFunctions();
        window.dispatchEvent(window.demoPauseEvt);
        window.demoIsPaused = false;
    };
};

const breakPointRegex = /^\s*_{3}(?:\([0-9]+\))?.*\r?\n?/gm;


const makeTypingFN = (code) => {
    return async jar => {
        let content = jar.toString();
        
        for (const char of [...code]) {
            content += char;
            jar.updateCode(content);
            jar.updateLines(content);
            await window.sleep(Math.floor(Math.random() * 50 + 30));
        }     
    };
};

const makeDemo = (id, code, jar, contodo) => {
    const instanceId = randID();
    window[instanceId] = new Event(instanceId);
     
    const codeUnits = code.split(breakPointRegex);
    let breakpoints = [];
    const breakpointsArr = code.match(breakPointRegex);
    if (breakpointsArr) {
        breakpointsArr.forEach(bp => breakpoints.push(Number(bp.replace(/[^0-9]/g, ""))));
        breakpoints.push(0);
    }
    
    let codeInstructions = `await window.waitPromise("${instanceId}");\n`;
    const typingInstructions = [];
    const lastIndex = codeUnits.length-1;

    codeUnits.forEach((codeUnit, i) => {

        const typingFN = makeTypingFN(codeUnit);

        typingInstructions.push(typingFN);
        typingInstructions.push(() => window.dispatchEvent(window[instanceId]));
        typingInstructions.push(async () => await window.waitPromise(instanceId));

        codeInstructions += codeUnit;
        if (i < lastIndex) {
            codeInstructions += `await window.sleep(${breakpoints[i]+10});\n`;
            codeInstructions += `window.dispatchEvent(window.${instanceId})\n`;
            codeInstructions += `await waitPromise("${instanceId}")\n`;
        }
    });

    console.log(codeInstructions);
    console.log(typingInstructions);
    
    const demoFN = async () => {
        if (window.isDemoing) {
            throw new Error("A demo is currently running. Starting was blocked.");
        } 
        window.demoPause = false;
        window.isDemoing = true;
        contodo.clear(false);
        contodo.initFunctions();
        
        jar.updateLines("");
        jar.updateCode("");
        
        try {
            (async () => {
                for (const fn of typingInstructions) {
                    await fn(jar);
                }
            })();
            const fn = new AsyncFunction(codeInstructions);
            await fn();
        } catch (err) {
            throwError(err, id);
        }
        
        contodo.restoreDefaultConsole();
        window.isDemoing = false;
    };
    
    return [
        demoFN,
        pauseDemoFN(contodo),
        resumeDemoFN(contodo)
    ];
};


const getCleanCode = code => code.replace(breakPointRegex, "");


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
    getCleanCode,
    makeDemo,
    throwError
};
