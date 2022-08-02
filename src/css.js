const getCSS = async url => {
    const response = await fetch(url);
            
    if (!response.ok) {
        throw Error(response);
    }
    return await response.text();
};

const mainCSS = await getCSS("../css/main.css");
const prismCSS = await getCSS("../css/prism.css");

export { mainCSS, prismCSS };
