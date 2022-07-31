const getCSS = async url => {
    const response = await fetch(url);
            
    if (!response.ok) {
        throw Error(response);
    }
    return await response.text();
};

const contodoCSS = await getCSS("../css/contodo.css");
const prismCSS = await getCSS("../css/prism.css");

export { contodoCSS, prismCSS };
