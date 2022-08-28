# JSLiveExamples

[![License](https://img.shields.io/github/license/UmamiAppearance/JSLiveExamples?color=009911&style=for-the-badge)](./LICENSE)
[![npm](https://img.shields.io/npm/v/js-live-examples?color=%23009911&style=for-the-badge)](https://www.npmjs.com/package/js-live-examples)

Create HTML live examples to demonstrate JavaScript code in action

![JSLiveExamples-Image](https://github.com/UmamiAppearance/JSLiveExamples/blob/main/media/JSLiveExamples.gif?raw=true)

## Idea
There are countless JavaScript packages out there. For the developer it is always a lot of work to think about how to present it to a possible user. A lot of times apart from the documentation and/or readme file one has to rely on third party services to show live examples to demonstrate the code in action. **JSLiveExamples** makes it possible to keep the creation of live examples of JavaScript code for the browser inside of e.g. your github repository (with GithubPages or with whatever service which is able to serve HTML).  
  
A JSLiveExample is just a little template which gets inserted into the HTML code at the place where the example should be, the rest is done by the JavaScript application.  
  
The user can see, change, and run the provided code. The console output gets logged to the page. Watch the [demo](https://umamiappearance.github.io/JSLiveExamples/examples/demo.html) to see it in action.


## Installation
### GitHub
```sh
git clone https://github.com/UmamiAppearance/JSLiveExamples.git
```

### npm
```sh
nmp install js-live-examples
```

## Builds
Builds can be find in the directory dist ([github:dist](https://github.com/UmamiAppearance/JSLiveExamples/tree/main/dist)). 

You have two builds available ([esm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and [iife](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)), plus a minified version of each. 
* ``js-live-examples.esm.js``
* ``js-live-examples.esm.min.js``
* ``js-live-examples.iife.min.js``
* ``js-live-examples.iife.js``

Also in subfolder _no-style_ ([github:dist/no-style](https://github.com/UmamiAppearance/JSLiveExamples/tree/main/dist/no-style)), there are builds available without build in css.


If you want to build your own copy run:
```sh
npm run build
```


## Usage
First either [import](#importing) the esm-module or add the iife script tag to the HTML page. After that, the templates for the examples can be [used](#creating-a-live-example) inside of your HTML page.


### Importing

#### ES6
```html
<script type="module">
    import liveExamples from "./<path>/js-live-examples.esm.min.js";
</script>
```
##### CDN (jsdelivr)
```html
<script type="module">
    import liveExamples from "https://cdn.jsdelivr.net/npm/js-live-examples@latest/dist/js-live-examples.esm.min.js;
</script>
```

#### IIFE
```html
<script src="./<path>/js-live-examples.iife.min.js"></script>
```

##### CDN (jsdelivr)
```html
<script src="https://cdn.jsdelivr.net/npm/js-live-examples@latest/dist/js-live-examples.iife.min.js"></script>
```

### Creating an Example
After importing the templates can be used inside of the HTML. A Basic example may look like this:

```html
<template class="live-example">
    <h1>Example: Hello World!</h1>
    <script>
        const helloWorld = () => {
            console.log("Hello World!");
        };
        helloWorld();
    </script>
</template>
```
* The result of this code is shown at the very [top](#jsliveexamples); also the [demo](https://umamiappearance.github.io/JSLiveExamples/examples/demo.html) uses the same code.
* The most important part is the class name `live-example`. This is the property **JSLiveExamples** is looking for.
* The ``<h1>``-tag becomes the title of the example.
* The ``<script>``-tag contains initial code of the example.

**Note:**
* The final example gets inserted directly at the location of the template.
* Additional class names for the example are possible.
* Every example gets the id "live-example-<nr>", for a custom id, pass the attribute `for="myId"` to the `<template`-tag
* If the code should execute automatically, pass the data-attribute `data-run="true"` to the script-tag


## License
This work is licensed under [GPL-3.0](https://opensource.org/licenses/GPL-3.0).
