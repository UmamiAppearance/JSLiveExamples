const AsyncFunction = (async function () {}).constructor;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const makeDemo = code => {
    const regex = /^_{3}(?:\([0-9]+\))?.*\r?\n?/gm;
    const breakpoints = code.match(regex);
    const instructions = code.split(regex);

    console.log(breakpoints);
    return instructions;
};

export {
    AsyncFunction,
    makeDemo
};
