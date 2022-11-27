const RUNNER_FUNCTION_NAME = "liveExampleCodeRunner";

const AsyncFunction = (async function () {}).constructor;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const makeDemo = (id, code, jar, contodo) => {
    const regex = /^_{3}(?:\([0-9]+\))?.*\r?\n?/gm;
    const instructions = code.split(regex);
    const breakpoints = code.match(regex)
        .map(bp => Number(bp.replace(/[^0-9]/g, "")));
    

    console.log(breakpoints);
    jar.updateCode(instructions.join(""));
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
