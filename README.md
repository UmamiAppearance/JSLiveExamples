# JSLiveExamples

[![License](https://img.shields.io/github/license/UmamiAppearance/JSLiveExamples?color=009911&style=for-the-badge)](./LICENSE)
[![npm](https://img.shields.io/npm/v/js-live-examples?color=%23009911&style=for-the-badge)](https://www.npmjs.com/package/js-live-examples)

Create HTML live examples to demonstrate JavaScript code in action

![JSLiveExamples-Image](https://github.com/UmamiAppearance/JSLiveExamples/blob/main/media/JSLiveExamples.gif?raw=true)

## Idea
There are countless JavaScript packages out there. For the developer it is always a lot of work to think about how to present it to a possible user. A lot of times apart from the documentation and/or readme file one has to rely on third party services to show live examples to demonstrate the code in action. **JSLiveExamples** makes it possible to keep the creation of live examples inside of your github repository (or whatever service which is able to serve html [like GithubPages]).  
  
A JSLiveExample is just a little template which gets inserted into the HTML code at the place where the example should be, the rest is done by the JavaScript application.  
  
The user can see, change, and run the provided code, the console output gets logged to the page. Watch the [demo](https://umamiappearance.github.io/JSLiveExamples/examples/demo.html) to see it in action.


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
Builds can be find them in the directory dist ([github:dist](https://github.com/UmamiAppearance/JSLiveExamples/tree/main/dist)). 

If you want to build your own copy run:
```sh
npm run build
```


## Usage
First either import the esm-module or add the iife script tag to the HTML page. After that, the templates for the examples can be used inside of the HTML.


### ES6
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


### IIFE
```html
<script src="./<path>/js-live-examples.iife.min.js"></script>
```

##### CDN (jsdelivr)
```html
<script src="https://cdn.jsdelivr.net/npm/js-live-examples@latest/dist/js-live-examples.iife.min.js"></script>
```


## License
This work is licensed under [GPL-3.0](https://opensource.org/licenses/GPL-3.0).
