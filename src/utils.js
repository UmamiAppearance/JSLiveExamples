const RUNNER_FUNCTION_NAME = "liveExampleCodeRunner";
const AsyncFunction = (async function(){}).constructor;
const randID = () => `_${Math.random().toString(16).slice(2)}`;

/**
 * A promise, which remains in a pending state
 * until a event occurs.
 * @param {string} name - Event name. 
 * @returns {Object} - Wait Promise.
 */
window.waitPromise = name => {
    if (window.abortDemo) {
        return Promise.reject();
    }
       
    return new Promise((resolve, reject) => {

        const resolveFN = () => {
            window.removeEventListener("abort" + name, rejectFN, false);
            return resolve();
        };
    
        const rejectFN = () => {
            window.removeEventListener(name, resolveFN, false);
            return reject();
        };

        window.addEventListener(name, resolveFN, {
            capture: false,
            once: true,
        });
        
        window.addEventListener("abort" + name, rejectFN, {
            capture: false,
            once: true,
        });
    });
};

/**
 * Async Sleep function, which can also wait
 * until a pause event resolves.
 * @param {*} ms 
 * @returns 
 */
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

/**
 * Generates a pause function. Which can
 * control a contodo instance.
 * @param {Object} contodo - contodo instance.
 * @param {Object} jar - Code Jar instance.
 * @returns {function} - Pause function.
 */
const pauseDemoFN = (contodo, jar) => {
    return () => {
        if (!window.isDemoing || window.demoIsPaused) {
            return;
        }
        jar.typing = false;
        contodo.restoreDefaultConsole();
        window.demoPause = window.waitPromise("demoPause");
        window.demoIsPaused = true;
    };
};

/**
 * Generates a resume function. Which can
 * control a contodo instance.
 * @param {Object} contodo - contodo instance.
 * @param {Object} jar - Code Jar instance.
 * @returns {function} - resume function.
 */
const resumeDemoFN = (contodo, jar) => {
    return () => {
        if (!window.isDemoing || !window.demoIsPaused) {
            return;
        }
        contodo.initFunctions();
        window.dispatchEvent(window.demoPauseEvt);
        window.demoIsPaused = false;
        jar.typing = true;
    };
};

/**
 * Generates a stop function. Which can
 * control all parts of a LiveExample.
 * @param {string} instanceId - ID of the instance.
 * @param {string} code - Source code of the example.
 * @param {Object} jar - Code jar instance.
 * @param {Object} contodo - Contodo instance.
 * @returns {function} - Pause function.
 */
const stopDemoFN = (instanceId, code, jar, contodo) => {
    return () => {

        contodo.restoreDefaultConsole();
        contodo.clear(false);

        window.abortDemo = true;
        
        window.dispatchEvent(window.demoPauseEvt);
        window.dispatchEvent(window["abort" + instanceId]);

        jar.updateCode(code);
        jar.updateLines(code);
        jar.typing = false;
        
        window.isDemoing = false;

    };
};


/**
 * Generates a function, which emulates keyboard typing
 * on a CodeJar instance.
 * @param {string} code - The source code for the typing emulation.
 * @returns {function} - Typing function.
 */
const makeTypingFN = (code, options) => {
    const minRN = options.typingSpeed - options.typingVariation/2;
    const maxRN = minRN + options.typingVariation;
    
    return async jar => {
        let content = jar.toString();
        jar.typing = true;
        const charArray = [...code];
        let last;
        
        for (const char of charArray) {

            content += char;

            // if a newline is followed by a space:
            // continue (respect indentation)
            // print the character in any other case

            if (!(last === "\n" && char === " ")) {
                last = char;

                jar.updateCode(content);
                jar.updateLines(content);
                
                await window.sleep(Math.floor(Math.random() * maxRN + minRN));
            
            }

            if (window.abortDemo) {
                return;
            }
        }
        
        jar.typing = false;

        if (options.executionDelay) {
            await window.sleep(options.executionDelay);
        }
    };
};


/**
 * Generates all required functions for running
 * a LiveExample in demo mode.
 * @param {string} id - Id of the html-node. 
 * @param {string} code - The source code (with breakpoints) 
 * @param {Object} jar - A CodeJar instance. 
 * @param {Object} contodo - A contodo instance. 
 * @returns {array[]} - An array with the required functions and the source code with the breakpoints removed.
 */
const makeDemo = (id, code, jar, contodo, options) => {
    jar.updateLines("");
    jar.updateCode(""); 

    const instanceId = randID();
    window[instanceId] = new Event(instanceId);
    window["abort" + instanceId] = new Event("abort" + instanceId);

    // REGEX: 
    // * ignore whitespace but exclude newline
    // * look for three underscores
    // * optionally followed by a number between brackets 
    const breakPointRegex = /^[^\S\r\n]*_{3}(?:\([0-9]+\))?.*\r?\n?/gm;
    const codeUnits = code.split(breakPointRegex);
    let breakpoints = [];

    const breakpointsArr = code.match(breakPointRegex);
    if (breakpointsArr) {
        breakpointsArr.forEach(bp => breakpoints.push(Number(bp.replace(/[^0-9]/g, ""))));
        breakpoints.push(0);
    }
    
    let cleanCode = "";
    let codeInstructions = `await window.waitPromise("${instanceId}");\n`;
    const typingInstructions = [];
    const lastIndex = codeUnits.length-1;

    codeUnits.forEach((codeUnit, i) => {

        cleanCode += codeUnit;
        const typingFN = makeTypingFN(codeUnit, options);

        typingInstructions.push(typingFN);
        typingInstructions.push(() => window.dispatchEvent(window[instanceId]));
        typingInstructions.push(async () => await window.waitPromise(instanceId));

        codeInstructions += codeUnit;
        if (i < lastIndex) {
            codeInstructions += `await window.sleep(${Math.max(breakpoints[i], 10)});\n`;
            codeInstructions += `window.dispatchEvent(window.${instanceId});\n`;
            codeInstructions += `await waitPromise("${instanceId}");\n`;
        }
    });
    
    const demoFN = async () => {
         
        window.abortDemo = false;
        window.demoIsPaused = false;
        window.isDemoing = true;
        
        contodo.clear(false);
        contodo.initFunctions();
        
        jar.updateLines("");
        jar.updateCode("");
        
        try {
            (async () => {
                for (const fn of typingInstructions) {
                    try {
                        await fn(jar);
                    } catch {
                        return;
                    }
                    if (window.abortDemo) {
                        return;
                    }
                }
            })();
            const fn = new AsyncFunction(codeInstructions);
            window.FN = fn();
            await window.FN;
        } catch (err) {
            throwError(err, id);
        }
        
        // end waiter, if still hanging
        window.dispatchEvent(window[instanceId]);
        contodo.restoreDefaultConsole();
        window.isDemoing = false;
    };
    
    return [
        cleanCode,
        demoFN,
        pauseDemoFN(contodo, jar),
        resumeDemoFN(contodo, jar),
        stopDemoFN(instanceId, cleanCode, jar, contodo)
    ];
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
    if (!err || !err.message) {
        return;
    }
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
    makeDemo,
    throwError
};
