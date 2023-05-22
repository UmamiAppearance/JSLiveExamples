# JSLiveExamples

[![License](https://img.shields.io/github/license/UmamiAppearance/JSLiveExamples?color=009911&style=for-the-badge)](./LICENSE)
[![npm](https://img.shields.io/npm/v/js-live-examples?color=%23009911&style=for-the-badge)](https://www.npmjs.com/package/js-live-examples)

Create HTML live examples to demonstrate JavaScript code for the browser in action.

[![JSLiveExamples-Image](https://github.com/UmamiAppearance/JSLiveExamples/blob/main/media/JSLiveExamples.gif?raw=true)](https://umamiappearance.github.io/JSLiveExamples/examples/demo.html)

## Idea
There are countless JavaScript packages out there. For the developer it is always a lot of work to think about how to present it to a possible user. A lot of times apart from the documentation and/or readme file one has to rely on third party services to show live examples to demonstrate the code in action. **JSLiveExamples** makes it possible to keep the creation of live examples of JavaScript code for the browser inside of e.g. your github repository (with GithubPages or with whatever service which is able to serve HTML).  
  
A JSLiveExample is just a little template which gets inserted into the HTML code at the place where the example should be, the rest is done by the JavaScript application.  
  
The user can see, change, and run the provided code. The console output gets logged to the page. Optionally it is possible to use the [demo mode](#demo-mode), which includes a typing animation and break points. 
  
Watch [this example](https://umamiappearance.github.io/JSLiveExamples/examples/demo.html) to see it in action.

#### powered by:
 - [**codejar**](https://github.com/antonmedv/codejar)
 - [**contodo**](https://github.com/UmamiAppearance/contodo)
 - [**prismjs**](https://github.com/PrismJS/prism)


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

### Creating a Basic Example
After importing, the templates can be used inside of the HTML. A Basic example may look like this:

```html
<template class="live-example">
    <h1>Example: Hello World!</h1>

    <meta data-run="true">

    <script>
        const helloWorld = () => {
            console.log("Hello World!");
        };
        helloWorld();
    </script>
</template>
```
* The result of this code is shown at the very [top](#jsliveexamples)
* The most important part is the class name `live-example`. This is the property **JSLiveExamples** is looking for.
* The `<h1>`-tag becomes the title of the example.
* The `<meta>`-tag contains [options](#options) (in this case it enables the autostart)
* The `<script>`-tag contains initial code of the example.
* The final example gets inserted directly at the location of the template.
* Additional class names for the example are possible.
* Every example gets the id "live-example-\<nr\>", for a custom id, pass the attribute ``for="myId"`` to the ``<template>``-tag
* After the code was executed or a demo is done, the ``<example>`` emits the event ``executed``

### Options
To pass options to an example, use a `<meta>` tag inside of the template and pass arguments in the form of data-attributes.

| key                   | type                   | default     | effect                                                         |
| --------------------- | ---------------------- | ----------- | -------------------------------------------------------------- |
| data-buttons          | _Boolean_              | `true`      | removes the buttons if set to false                            |
| data-caret            | _Boolean_              | `true`      | if true a caret is emulated for the typing animation           |
| data-demo             | _Boolean_              | `false`     | enables the [demo-mode](#demo-mode) if set to true             |
| data-execution-delay  | _Number_               | `250`       | delay in _ms_ before current code block is getting executed    |
| data-indicator        | _Boolean_              | `true`      | if true a blinking dot indicates a running demo or code        |
| data-run              | _Boolean_              | `false`     | if true the example/demo is started/executed automatically     |
| data-scroll           | _Boolean_              | `true`      | if false the console node grows infinitely                     |
| data-transform        | _Boolean (or Keyword)_ | `true`      | if true a demo transforms into a regular example after it is done _(pass the keyword `"perm"` to keep it in the regular state)_ |
| data-typing-speed     | _Number_               | `60`        | value in _ms_ for the speed of the typing emulation            |
| data-typing-variation | _Number_               | `80`        | value in _ms_ for the randomly added imperfection when typing gets emulated |


### Demo-Mode
The _Demo-Mode_ is a way to present the code in a much more interesting way. The code is written in front of the eyes of the spectator and can be structured with breakpoints to add pauses. The demo can be paused (or stopped) and resumed at any time. To activate this mode, pass the data-attribute `data-demo="true"` to the `<meta>`-tag.  
  
Breakpoints can be added, by using at least three underscores inside of the `<script>`-tag at the relevant position in the code.
The template node for the [hello-world-example](https://umamiappearance.github.io/JSLiveExamples/examples/demo.html) for instance looks like so:
```html
<template class="live-example">
    <h1>Example: Hello World!</h1>

    <meta data-demo="true">

    <script>
        const helloWorld = () => {
            console.log("Hello World!");
        };
        ___();
        helloWorld();
    </script>
</template>
```
The brackets for the breakpoint are optional, but can be used to pass a number, which is the number of milliseconds before the next codeblock is getting executed (e.g. `___(2000)` for two seconds). The main purpose of a breakpoint is, that the code before the breakpoint is getting executed, before the journey continues.
  
You can use as many breakpoints as you like. The complete line with a breakpoint is getting removed from the visible code.

### Methods
Apart from the buttons, an example-node has direct access to its methods *(note, that demo specific methods are only available if the [demo-mode](#demo-mode) is set)*.

| method                | effect                             |
| --------------------- | ---------------------------------- |
| `.run()`              | _executes the code_                |
| `.reset()`            | _resets the code block_            |
| `.getCode()`          | _get current code as a string_     |
| `.updateCode(<code>)` | _set new code as a string_         |
| `.runDemo()`          | _runs a demo_                      |
| `.pauseDemo()`        | _pauses a demo_                    |
| `.resumeDemo()`       | _resumes a paused demo_            |
| `.stopDemo()`         | _stops a running or a paused demo_ |

Additionally, the initial code (the reset state) can be modified in regular mode. It can be accessed with the property `initialCode`.


## Code Sharing Service
If you like to share some code or want to demonstrate something, use this [Code Sharing Service](https://umamiappearance.github.io/JSLiveExamples/service/). _No account needed, mobile friendly, easy to use._


## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2023, UmamiAppearance
