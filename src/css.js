const urls = [
    "../css/contodo.css",
    "../css/prism.css"
]

let css = "";

for (const url of urls) {
    const response = await fetch(url);
            
    if (!response.ok) {
        throw Error(response);
    }
    css += await response.text();
}

export { css };
