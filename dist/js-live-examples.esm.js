/* PrismJS 1.28.0
https://prismjs.com/download.html#themes=prism&languages=clike+javascript */
/// <reference lib="WebWorker"/>

var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
			? self // if in worker
			: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 *
 * @license MIT <https://opensource.org/licenses/MIT>
 * @author Lea Verou <https://lea.verou.me>
 * @namespace
 * @public
 */
var Prism$1 = (function (_self) {

	// Private helper vars
	var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
	var uniqueId = 0;

	// The grammar object for plaintext
	var plainTextGrammar = {};


	var _ = {
		/**
		 * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
		 * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
		 * additional languages or plugins yourself.
		 *
		 * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
		 *
		 * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
		 * empty Prism object into the global scope before loading the Prism script like this:
		 *
		 * ```js
		 * window.Prism = window.Prism || {};
		 * Prism.manual = true;
		 * // add a new <script> to load Prism's script
		 * ```
		 *
		 * @default false
		 * @type {boolean}
		 * @memberof Prism
		 * @public
		 */
		manual: _self.Prism && _self.Prism.manual,
		/**
		 * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
		 * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
		 * own worker, you don't want it to do this.
		 *
		 * By setting this value to `true`, Prism will not add its own listeners to the worker.
		 *
		 * You obviously have to change this value before Prism executes. To do this, you can add an
		 * empty Prism object into the global scope before loading the Prism script like this:
		 *
		 * ```js
		 * window.Prism = window.Prism || {};
		 * Prism.disableWorkerMessageHandler = true;
		 * // Load Prism's script
		 * ```
		 *
		 * @default false
		 * @type {boolean}
		 * @memberof Prism
		 * @public
		 */
		disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,

		/**
		 * A namespace for utility methods.
		 *
		 * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
		 * change or disappear at any time.
		 *
		 * @namespace
		 * @memberof Prism
		 */
		util: {
			encode: function encode(tokens) {
				if (tokens instanceof Token) {
					return new Token(tokens.type, encode(tokens.content), tokens.alias);
				} else if (Array.isArray(tokens)) {
					return tokens.map(encode);
				} else {
					return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
				}
			},

			/**
			 * Returns the name of the type of the given value.
			 *
			 * @param {any} o
			 * @returns {string}
			 * @example
			 * type(null)      === 'Null'
			 * type(undefined) === 'Undefined'
			 * type(123)       === 'Number'
			 * type('foo')     === 'String'
			 * type(true)      === 'Boolean'
			 * type([1, 2])    === 'Array'
			 * type({})        === 'Object'
			 * type(String)    === 'Function'
			 * type(/abc+/)    === 'RegExp'
			 */
			type: function (o) {
				return Object.prototype.toString.call(o).slice(8, -1);
			},

			/**
			 * Returns a unique number for the given object. Later calls will still return the same number.
			 *
			 * @param {Object} obj
			 * @returns {number}
			 */
			objId: function (obj) {
				if (!obj['__id']) {
					Object.defineProperty(obj, '__id', { value: ++uniqueId });
				}
				return obj['__id'];
			},

			/**
			 * Creates a deep clone of the given object.
			 *
			 * The main intended use of this function is to clone language definitions.
			 *
			 * @param {T} o
			 * @param {Record<number, any>} [visited]
			 * @returns {T}
			 * @template T
			 */
			clone: function deepClone(o, visited) {
				visited = visited || {};

				var clone; var id;
				switch (_.util.type(o)) {
					case 'Object':
						id = _.util.objId(o);
						if (visited[id]) {
							return visited[id];
						}
						clone = /** @type {Record<string, any>} */ ({});
						visited[id] = clone;

						for (var key in o) {
							if (o.hasOwnProperty(key)) {
								clone[key] = deepClone(o[key], visited);
							}
						}

						return /** @type {any} */ (clone);

					case 'Array':
						id = _.util.objId(o);
						if (visited[id]) {
							return visited[id];
						}
						clone = [];
						visited[id] = clone;

						(/** @type {Array} */(/** @type {any} */(o))).forEach(function (v, i) {
							clone[i] = deepClone(v, visited);
						});

						return /** @type {any} */ (clone);

					default:
						return o;
				}
			},

			/**
			 * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
			 *
			 * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
			 *
			 * @param {Element} element
			 * @returns {string}
			 */
			getLanguage: function (element) {
				while (element) {
					var m = lang.exec(element.className);
					if (m) {
						return m[1].toLowerCase();
					}
					element = element.parentElement;
				}
				return 'none';
			},

			/**
			 * Sets the Prism `language-xxxx` class of the given element.
			 *
			 * @param {Element} element
			 * @param {string} language
			 * @returns {void}
			 */
			setLanguage: function (element, language) {
				// remove all `language-xxxx` classes
				// (this might leave behind a leading space)
				element.className = element.className.replace(RegExp(lang, 'gi'), '');

				// add the new `language-xxxx` class
				// (using `classList` will automatically clean up spaces for us)
				element.classList.add('language-' + language);
			},

			/**
			 * Returns the script element that is currently executing.
			 *
			 * This does __not__ work for line script element.
			 *
			 * @returns {HTMLScriptElement | null}
			 */
			currentScript: function () {
				if (typeof document === 'undefined') {
					return null;
				}
				if ('currentScript' in document && 1 < 2 /* hack to trip TS' flow analysis */) {
					return /** @type {any} */ (document.currentScript);
				}

				// IE11 workaround
				// we'll get the src of the current script by parsing IE11's error stack trace
				// this will not work for inline scripts

				try {
					throw new Error();
				} catch (err) {
					// Get file src url from stack. Specifically works with the format of stack traces in IE.
					// A stack will look like this:
					//
					// Error
					//    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
					//    at Global code (http://localhost/components/prism-core.js:606:1)

					var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
					if (src) {
						var scripts = document.getElementsByTagName('script');
						for (var i in scripts) {
							if (scripts[i].src == src) {
								return scripts[i];
							}
						}
					}
					return null;
				}
			},

			/**
			 * Returns whether a given class is active for `element`.
			 *
			 * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
			 * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
			 * given class is just the given class with a `no-` prefix.
			 *
			 * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
			 * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
			 * ancestors have the given class or the negated version of it, then the default activation will be returned.
			 *
			 * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
			 * version of it, the class is considered active.
			 *
			 * @param {Element} element
			 * @param {string} className
			 * @param {boolean} [defaultActivation=false]
			 * @returns {boolean}
			 */
			isActive: function (element, className, defaultActivation) {
				var no = 'no-' + className;

				while (element) {
					var classList = element.classList;
					if (classList.contains(className)) {
						return true;
					}
					if (classList.contains(no)) {
						return false;
					}
					element = element.parentElement;
				}
				return !!defaultActivation;
			}
		},

		/**
		 * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
		 *
		 * @namespace
		 * @memberof Prism
		 * @public
		 */
		languages: {
			/**
			 * The grammar for plain, unformatted text.
			 */
			plain: plainTextGrammar,
			plaintext: plainTextGrammar,
			text: plainTextGrammar,
			txt: plainTextGrammar,

			/**
			 * Creates a deep copy of the language with the given id and appends the given tokens.
			 *
			 * If a token in `redef` also appears in the copied language, then the existing token in the copied language
			 * will be overwritten at its original position.
			 *
			 * ## Best practices
			 *
			 * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
			 * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
			 * understand the language definition because, normally, the order of tokens matters in Prism grammars.
			 *
			 * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
			 * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
			 *
			 * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
			 * @param {Grammar} redef The new tokens to append.
			 * @returns {Grammar} The new language created.
			 * @public
			 * @example
			 * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
			 *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
			 *     // at its original position
			 *     'comment': { ... },
			 *     // CSS doesn't have a 'color' token, so this token will be appended
			 *     'color': /\b(?:red|green|blue)\b/
			 * });
			 */
			extend: function (id, redef) {
				var lang = _.util.clone(_.languages[id]);

				for (var key in redef) {
					lang[key] = redef[key];
				}

				return lang;
			},

			/**
			 * Inserts tokens _before_ another token in a language definition or any other grammar.
			 *
			 * ## Usage
			 *
			 * This helper method makes it easy to modify existing languages. For example, the CSS language definition
			 * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
			 * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
			 * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
			 * this:
			 *
			 * ```js
			 * Prism.languages.markup.style = {
			 *     // token
			 * };
			 * ```
			 *
			 * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
			 * before existing tokens. For the CSS example above, you would use it like this:
			 *
			 * ```js
			 * Prism.languages.insertBefore('markup', 'cdata', {
			 *     'style': {
			 *         // token
			 *     }
			 * });
			 * ```
			 *
			 * ## Special cases
			 *
			 * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
			 * will be ignored.
			 *
			 * This behavior can be used to insert tokens after `before`:
			 *
			 * ```js
			 * Prism.languages.insertBefore('markup', 'comment', {
			 *     'comment': Prism.languages.markup.comment,
			 *     // tokens after 'comment'
			 * });
			 * ```
			 *
			 * ## Limitations
			 *
			 * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
			 * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
			 * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
			 * deleting properties which is necessary to insert at arbitrary positions.
			 *
			 * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
			 * Instead, it will create a new object and replace all references to the target object with the new one. This
			 * can be done without temporarily deleting properties, so the iteration order is well-defined.
			 *
			 * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
			 * you hold the target object in a variable, then the value of the variable will not change.
			 *
			 * ```js
			 * var oldMarkup = Prism.languages.markup;
			 * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
			 *
			 * assert(oldMarkup !== Prism.languages.markup);
			 * assert(newMarkup === Prism.languages.markup);
			 * ```
			 *
			 * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
			 * object to be modified.
			 * @param {string} before The key to insert before.
			 * @param {Grammar} insert An object containing the key-value pairs to be inserted.
			 * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
			 * object to be modified.
			 *
			 * Defaults to `Prism.languages`.
			 * @returns {Grammar} The new grammar object.
			 * @public
			 */
			insertBefore: function (inside, before, insert, root) {
				root = root || /** @type {any} */ (_.languages);
				var grammar = root[inside];
				/** @type {Grammar} */
				var ret = {};

				for (var token in grammar) {
					if (grammar.hasOwnProperty(token)) {

						if (token == before) {
							for (var newToken in insert) {
								if (insert.hasOwnProperty(newToken)) {
									ret[newToken] = insert[newToken];
								}
							}
						}

						// Do not insert token which also occur in insert. See #1525
						if (!insert.hasOwnProperty(token)) {
							ret[token] = grammar[token];
						}
					}
				}

				var old = root[inside];
				root[inside] = ret;

				// Update references in other language definitions
				_.languages.DFS(_.languages, function (key, value) {
					if (value === old && key != inside) {
						this[key] = ret;
					}
				});

				return ret;
			},

			// Traverse a language definition with Depth First Search
			DFS: function DFS(o, callback, type, visited) {
				visited = visited || {};

				var objId = _.util.objId;

				for (var i in o) {
					if (o.hasOwnProperty(i)) {
						callback.call(o, i, o[i], type || i);

						var property = o[i];
						var propertyType = _.util.type(property);

						if (propertyType === 'Object' && !visited[objId(property)]) {
							visited[objId(property)] = true;
							DFS(property, callback, null, visited);
						} else if (propertyType === 'Array' && !visited[objId(property)]) {
							visited[objId(property)] = true;
							DFS(property, callback, i, visited);
						}
					}
				}
			}
		},

		plugins: {},

		/**
		 * This is the most high-level function in Prism’s API.
		 * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
		 * each one of them.
		 *
		 * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
		 *
		 * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
		 * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
		 * @memberof Prism
		 * @public
		 */
		highlightAll: function (async, callback) {
			_.highlightAllUnder(document, async, callback);
		},

		/**
		 * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
		 * {@link Prism.highlightElement} on each one of them.
		 *
		 * The following hooks will be run:
		 * 1. `before-highlightall`
		 * 2. `before-all-elements-highlight`
		 * 3. All hooks of {@link Prism.highlightElement} for each element.
		 *
		 * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
		 * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
		 * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
		 * @memberof Prism
		 * @public
		 */
		highlightAllUnder: function (container, async, callback) {
			var env = {
				callback: callback,
				container: container,
				selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
			};

			_.hooks.run('before-highlightall', env);

			env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

			_.hooks.run('before-all-elements-highlight', env);

			for (var i = 0, element; (element = env.elements[i++]);) {
				_.highlightElement(element, async === true, env.callback);
			}
		},

		/**
		 * Highlights the code inside a single element.
		 *
		 * The following hooks will be run:
		 * 1. `before-sanity-check`
		 * 2. `before-highlight`
		 * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
		 * 4. `before-insert`
		 * 5. `after-highlight`
		 * 6. `complete`
		 *
		 * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
		 * the element's language.
		 *
		 * @param {Element} element The element containing the code.
		 * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
		 * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
		 * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
		 * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
		 *
		 * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
		 * asynchronous highlighting to work. You can build your own bundle on the
		 * [Download page](https://prismjs.com/download.html).
		 * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
		 * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
		 * @memberof Prism
		 * @public
		 */
		highlightElement: function (element, async, callback) {
			// Find language
			var language = _.util.getLanguage(element);
			var grammar = _.languages[language];

			// Set language on the element, if not present
			_.util.setLanguage(element, language);

			// Set language on the parent, for styling
			var parent = element.parentElement;
			if (parent && parent.nodeName.toLowerCase() === 'pre') {
				_.util.setLanguage(parent, language);
			}

			var code = element.textContent;

			var env = {
				element: element,
				language: language,
				grammar: grammar,
				code: code
			};

			function insertHighlightedCode(highlightedCode) {
				env.highlightedCode = highlightedCode;

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;

				_.hooks.run('after-highlight', env);
				_.hooks.run('complete', env);
				callback && callback.call(env.element);
			}

			_.hooks.run('before-sanity-check', env);

			// plugins may change/add the parent/element
			parent = env.element.parentElement;
			if (parent && parent.nodeName.toLowerCase() === 'pre' && !parent.hasAttribute('tabindex')) {
				parent.setAttribute('tabindex', '0');
			}

			if (!env.code) {
				_.hooks.run('complete', env);
				callback && callback.call(env.element);
				return;
			}

			_.hooks.run('before-highlight', env);

			if (!env.grammar) {
				insertHighlightedCode(_.util.encode(env.code));
				return;
			}

			if (async && _self.Worker) {
				var worker = new Worker(_.filename);

				worker.onmessage = function (evt) {
					insertHighlightedCode(evt.data);
				};

				worker.postMessage(JSON.stringify({
					language: env.language,
					code: env.code,
					immediateClose: true
				}));
			} else {
				insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
			}
		},

		/**
		 * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
		 * and the language definitions to use, and returns a string with the HTML produced.
		 *
		 * The following hooks will be run:
		 * 1. `before-tokenize`
		 * 2. `after-tokenize`
		 * 3. `wrap`: On each {@link Token}.
		 *
		 * @param {string} text A string with the code to be highlighted.
		 * @param {Grammar} grammar An object containing the tokens to use.
		 *
		 * Usually a language definition like `Prism.languages.markup`.
		 * @param {string} language The name of the language definition passed to `grammar`.
		 * @returns {string} The highlighted HTML.
		 * @memberof Prism
		 * @public
		 * @example
		 * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
		 */
		highlight: function (text, grammar, language) {
			var env = {
				code: text,
				grammar: grammar,
				language: language
			};
			_.hooks.run('before-tokenize', env);
			if (!env.grammar) {
				throw new Error('The language "' + env.language + '" has no grammar.');
			}
			env.tokens = _.tokenize(env.code, env.grammar);
			_.hooks.run('after-tokenize', env);
			return Token.stringify(_.util.encode(env.tokens), env.language);
		},

		/**
		 * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
		 * and the language definitions to use, and returns an array with the tokenized code.
		 *
		 * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
		 *
		 * This method could be useful in other contexts as well, as a very crude parser.
		 *
		 * @param {string} text A string with the code to be highlighted.
		 * @param {Grammar} grammar An object containing the tokens to use.
		 *
		 * Usually a language definition like `Prism.languages.markup`.
		 * @returns {TokenStream} An array of strings and tokens, a token stream.
		 * @memberof Prism
		 * @public
		 * @example
		 * let code = `var foo = 0;`;
		 * let tokens = Prism.tokenize(code, Prism.languages.javascript);
		 * tokens.forEach(token => {
		 *     if (token instanceof Prism.Token && token.type === 'number') {
		 *         console.log(`Found numeric literal: ${token.content}`);
		 *     }
		 * });
		 */
		tokenize: function (text, grammar) {
			var rest = grammar.rest;
			if (rest) {
				for (var token in rest) {
					grammar[token] = rest[token];
				}

				delete grammar.rest;
			}

			var tokenList = new LinkedList();
			addAfter(tokenList, tokenList.head, text);

			matchGrammar(text, tokenList, grammar, tokenList.head, 0);

			return toArray(tokenList);
		},

		/**
		 * @namespace
		 * @memberof Prism
		 * @public
		 */
		hooks: {
			all: {},

			/**
			 * Adds the given callback to the list of callbacks for the given hook.
			 *
			 * The callback will be invoked when the hook it is registered for is run.
			 * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
			 *
			 * One callback function can be registered to multiple hooks and the same hook multiple times.
			 *
			 * @param {string} name The name of the hook.
			 * @param {HookCallback} callback The callback function which is given environment variables.
			 * @public
			 */
			add: function (name, callback) {
				var hooks = _.hooks.all;

				hooks[name] = hooks[name] || [];

				hooks[name].push(callback);
			},

			/**
			 * Runs a hook invoking all registered callbacks with the given environment variables.
			 *
			 * Callbacks will be invoked synchronously and in the order in which they were registered.
			 *
			 * @param {string} name The name of the hook.
			 * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
			 * @public
			 */
			run: function (name, env) {
				var callbacks = _.hooks.all[name];

				if (!callbacks || !callbacks.length) {
					return;
				}

				for (var i = 0, callback; (callback = callbacks[i++]);) {
					callback(env);
				}
			}
		},

		Token: Token
	};
	_self.Prism = _;


	// Typescript note:
	// The following can be used to import the Token type in JSDoc:
	//
	//   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

	/**
	 * Creates a new token.
	 *
	 * @param {string} type See {@link Token#type type}
	 * @param {string | TokenStream} content See {@link Token#content content}
	 * @param {string|string[]} [alias] The alias(es) of the token.
	 * @param {string} [matchedStr=""] A copy of the full string this token was created from.
	 * @class
	 * @global
	 * @public
	 */
	function Token(type, content, alias, matchedStr) {
		/**
		 * The type of the token.
		 *
		 * This is usually the key of a pattern in a {@link Grammar}.
		 *
		 * @type {string}
		 * @see GrammarToken
		 * @public
		 */
		this.type = type;
		/**
		 * The strings or tokens contained by this token.
		 *
		 * This will be a token stream if the pattern matched also defined an `inside` grammar.
		 *
		 * @type {string | TokenStream}
		 * @public
		 */
		this.content = content;
		/**
		 * The alias(es) of the token.
		 *
		 * @type {string|string[]}
		 * @see GrammarToken
		 * @public
		 */
		this.alias = alias;
		// Copy of the full string this token was created from
		this.length = (matchedStr || '').length | 0;
	}

	/**
	 * A token stream is an array of strings and {@link Token Token} objects.
	 *
	 * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
	 * them.
	 *
	 * 1. No adjacent strings.
	 * 2. No empty strings.
	 *
	 *    The only exception here is the token stream that only contains the empty string and nothing else.
	 *
	 * @typedef {Array<string | Token>} TokenStream
	 * @global
	 * @public
	 */

	/**
	 * Converts the given token or token stream to an HTML representation.
	 *
	 * The following hooks will be run:
	 * 1. `wrap`: On each {@link Token}.
	 *
	 * @param {string | Token | TokenStream} o The token or token stream to be converted.
	 * @param {string} language The name of current language.
	 * @returns {string} The HTML representation of the token or token stream.
	 * @memberof Token
	 * @static
	 */
	Token.stringify = function stringify(o, language) {
		if (typeof o == 'string') {
			return o;
		}
		if (Array.isArray(o)) {
			var s = '';
			o.forEach(function (e) {
				s += stringify(e, language);
			});
			return s;
		}

		var env = {
			type: o.type,
			content: stringify(o.content, language),
			tag: 'span',
			classes: ['token', o.type],
			attributes: {},
			language: language
		};

		var aliases = o.alias;
		if (aliases) {
			if (Array.isArray(aliases)) {
				Array.prototype.push.apply(env.classes, aliases);
			} else {
				env.classes.push(aliases);
			}
		}

		_.hooks.run('wrap', env);

		var attributes = '';
		for (var name in env.attributes) {
			attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
		}

		return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
	};

	/**
	 * @param {RegExp} pattern
	 * @param {number} pos
	 * @param {string} text
	 * @param {boolean} lookbehind
	 * @returns {RegExpExecArray | null}
	 */
	function matchPattern(pattern, pos, text, lookbehind) {
		pattern.lastIndex = pos;
		var match = pattern.exec(text);
		if (match && lookbehind && match[1]) {
			// change the match to remove the text matched by the Prism lookbehind group
			var lookbehindLength = match[1].length;
			match.index += lookbehindLength;
			match[0] = match[0].slice(lookbehindLength);
		}
		return match;
	}

	/**
	 * @param {string} text
	 * @param {LinkedList<string | Token>} tokenList
	 * @param {any} grammar
	 * @param {LinkedListNode<string | Token>} startNode
	 * @param {number} startPos
	 * @param {RematchOptions} [rematch]
	 * @returns {void}
	 * @private
	 *
	 * @typedef RematchOptions
	 * @property {string} cause
	 * @property {number} reach
	 */
	function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
		for (var token in grammar) {
			if (!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}

			var patterns = grammar[token];
			patterns = Array.isArray(patterns) ? patterns : [patterns];

			for (var j = 0; j < patterns.length; ++j) {
				if (rematch && rematch.cause == token + ',' + j) {
					return;
				}

				var patternObj = patterns[j];
				var inside = patternObj.inside;
				var lookbehind = !!patternObj.lookbehind;
				var greedy = !!patternObj.greedy;
				var alias = patternObj.alias;

				if (greedy && !patternObj.pattern.global) {
					// Without the global flag, lastIndex won't work
					var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
					patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
				}

				/** @type {RegExp} */
				var pattern = patternObj.pattern || patternObj;

				for ( // iterate the token list and keep track of the current token/string position
					var currentNode = startNode.next, pos = startPos;
					currentNode !== tokenList.tail;
					pos += currentNode.value.length, currentNode = currentNode.next
				) {

					if (rematch && pos >= rematch.reach) {
						break;
					}

					var str = currentNode.value;

					if (tokenList.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						return;
					}

					if (str instanceof Token) {
						continue;
					}

					var removeCount = 1; // this is the to parameter of removeBetween
					var match;

					if (greedy) {
						match = matchPattern(pattern, pos, text, lookbehind);
						if (!match || match.index >= text.length) {
							break;
						}

						var from = match.index;
						var to = match.index + match[0].length;
						var p = pos;

						// find the node that contains the match
						p += currentNode.value.length;
						while (from >= p) {
							currentNode = currentNode.next;
							p += currentNode.value.length;
						}
						// adjust pos (and p)
						p -= currentNode.value.length;
						pos = p;

						// the current node is a Token, then the match starts inside another Token, which is invalid
						if (currentNode.value instanceof Token) {
							continue;
						}

						// find the last node which is affected by this match
						for (
							var k = currentNode;
							k !== tokenList.tail && (p < to || typeof k.value === 'string');
							k = k.next
						) {
							removeCount++;
							p += k.value.length;
						}
						removeCount--;

						// replace with the new match
						str = text.slice(pos, p);
						match.index -= pos;
					} else {
						match = matchPattern(pattern, 0, str, lookbehind);
						if (!match) {
							continue;
						}
					}

					// eslint-disable-next-line no-redeclare
					var from = match.index;
					var matchStr = match[0];
					var before = str.slice(0, from);
					var after = str.slice(from + matchStr.length);

					var reach = pos + str.length;
					if (rematch && reach > rematch.reach) {
						rematch.reach = reach;
					}

					var removeFrom = currentNode.prev;

					if (before) {
						removeFrom = addAfter(tokenList, removeFrom, before);
						pos += before.length;
					}

					removeRange(tokenList, removeFrom, removeCount);

					var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
					currentNode = addAfter(tokenList, removeFrom, wrapped);

					if (after) {
						addAfter(tokenList, currentNode, after);
					}

					if (removeCount > 1) {
						// at least one Token object was removed, so we have to do some rematching
						// this can only happen if the current pattern is greedy

						/** @type {RematchOptions} */
						var nestedRematch = {
							cause: token + ',' + j,
							reach: reach
						};
						matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);

						// the reach might have been extended because of the rematching
						if (rematch && nestedRematch.reach > rematch.reach) {
							rematch.reach = nestedRematch.reach;
						}
					}
				}
			}
		}
	}

	/**
	 * @typedef LinkedListNode
	 * @property {T} value
	 * @property {LinkedListNode<T> | null} prev The previous node.
	 * @property {LinkedListNode<T> | null} next The next node.
	 * @template T
	 * @private
	 */

	/**
	 * @template T
	 * @private
	 */
	function LinkedList() {
		/** @type {LinkedListNode<T>} */
		var head = { value: null, prev: null, next: null };
		/** @type {LinkedListNode<T>} */
		var tail = { value: null, prev: head, next: null };
		head.next = tail;

		/** @type {LinkedListNode<T>} */
		this.head = head;
		/** @type {LinkedListNode<T>} */
		this.tail = tail;
		this.length = 0;
	}

	/**
	 * Adds a new node with the given value to the list.
	 *
	 * @param {LinkedList<T>} list
	 * @param {LinkedListNode<T>} node
	 * @param {T} value
	 * @returns {LinkedListNode<T>} The added node.
	 * @template T
	 */
	function addAfter(list, node, value) {
		// assumes that node != list.tail && values.length >= 0
		var next = node.next;

		var newNode = { value: value, prev: node, next: next };
		node.next = newNode;
		next.prev = newNode;
		list.length++;

		return newNode;
	}
	/**
	 * Removes `count` nodes after the given node. The given node will not be removed.
	 *
	 * @param {LinkedList<T>} list
	 * @param {LinkedListNode<T>} node
	 * @param {number} count
	 * @template T
	 */
	function removeRange(list, node, count) {
		var next = node.next;
		for (var i = 0; i < count && next !== list.tail; i++) {
			next = next.next;
		}
		node.next = next;
		next.prev = node;
		list.length -= i;
	}
	/**
	 * @param {LinkedList<T>} list
	 * @returns {T[]}
	 * @template T
	 */
	function toArray(list) {
		var array = [];
		var node = list.head.next;
		while (node !== list.tail) {
			array.push(node.value);
			node = node.next;
		}
		return array;
	}


	if (!_self.document) {
		if (!_self.addEventListener) {
			// in Node.js
			return _;
		}

		if (!_.disableWorkerMessageHandler) {
			// In worker
			_self.addEventListener('message', function (evt) {
				var message = JSON.parse(evt.data);
				var lang = message.language;
				var code = message.code;
				var immediateClose = message.immediateClose;

				_self.postMessage(_.highlight(code, _.languages[lang], lang));
				if (immediateClose) {
					_self.close();
				}
			}, false);
		}

		return _;
	}

	// Get current script and highlight
	var script = _.util.currentScript();

	if (script) {
		_.filename = script.src;

		if (script.hasAttribute('data-manual')) {
			_.manual = true;
		}
	}

	function highlightAutomaticallyCallback() {
		if (!_.manual) {
			_.highlightAll();
		}
	}

	if (!_.manual) {
		// If the document state is "loading", then we'll use DOMContentLoaded.
		// If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
		// DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
		// might take longer one animation frame to execute which can create a race condition where only some plugins have
		// been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
		// See https://github.com/PrismJS/prism/issues/2102
		var readyState = document.readyState;
		if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
			document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
		} else {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(highlightAutomaticallyCallback);
			} else {
				window.setTimeout(highlightAutomaticallyCallback, 16);
			}
		}
	}

	return _;

}(_self));

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Prism$1;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
	global.Prism = Prism$1;
}
Prism$1.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true,
			greedy: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true
		}
	],
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
		lookbehind: true,
		inside: {
			'punctuation': /[.\\]/
		}
	},
	'keyword': /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
	'boolean': /\b(?:false|true)\b/,
	'function': /\b\w+(?=\()/,
	'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
	'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
	'punctuation': /[{}[\];(),.:]/
};

Prism$1.languages.javascript = Prism$1.languages.extend('clike', {
	'class-name': [
		Prism$1.languages.clike['class-name'],
		{
			pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
			lookbehind: true
		}
	],
	'keyword': [
		{
			pattern: /((?:^|\})\s*)catch\b/,
			lookbehind: true
		},
		{
			pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
			lookbehind: true
		},
	],
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
	'number': {
		pattern: RegExp(
			/(^|[^\w$])/.source +
			'(?:' +
			(
				// constant
				/NaN|Infinity/.source +
				'|' +
				// binary integer
				/0[bB][01]+(?:_[01]+)*n?/.source +
				'|' +
				// octal integer
				/0[oO][0-7]+(?:_[0-7]+)*n?/.source +
				'|' +
				// hexadecimal integer
				/0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
				'|' +
				// decimal bigint
				/\d+(?:_\d+)*n/.source +
				'|' +
				// decimal number (integer or float) but no bigint
				/(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source
			) +
			')' +
			/(?![\w$])/.source
		),
		lookbehind: true
	},
	'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});

Prism$1.languages.javascript['class-name'][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;

Prism$1.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: RegExp(
			// lookbehind
			// eslint-disable-next-line regexp/no-dupe-characters-character-class
			/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source +
			// Regex pattern:
			// There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
			// classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
			// with the only syntax, so we have to define 2 different regex patterns.
			/\//.source +
			'(?:' +
			/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source +
			'|' +
			// `v` flag syntax. This supports 3 levels of nested character classes.
			/(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source +
			')' +
			// lookahead
			/(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
		),
		lookbehind: true,
		greedy: true,
		inside: {
			'regex-source': {
				pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
				lookbehind: true,
				alias: 'language-regex',
				inside: Prism$1.languages.regex
			},
			'regex-delimiter': /^\/|\/$/,
			'regex-flags': /^[a-z]+$/,
		}
	},
	// This must be declared before keyword because we use "function" inside the look-forward
	'function-variable': {
		pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
		alias: 'function'
	},
	'parameter': [
		{
			pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
			lookbehind: true,
			inside: Prism$1.languages.javascript
		},
		{
			pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
			lookbehind: true,
			inside: Prism$1.languages.javascript
		},
		{
			pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
			lookbehind: true,
			inside: Prism$1.languages.javascript
		},
		{
			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
			lookbehind: true,
			inside: Prism$1.languages.javascript
		}
	],
	'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism$1.languages.insertBefore('javascript', 'string', {
	'hashbang': {
		pattern: /^#!.*/,
		greedy: true,
		alias: 'comment'
	},
	'template-string': {
		pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
		greedy: true,
		inside: {
			'template-punctuation': {
				pattern: /^`|`$/,
				alias: 'string'
			},
			'interpolation': {
				pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
				lookbehind: true,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\$\{|\}$/,
						alias: 'punctuation'
					},
					rest: Prism$1.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	},
	'string-property': {
		pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
		lookbehind: true,
		greedy: true,
		alias: 'property'
	}
});

Prism$1.languages.insertBefore('javascript', 'operator', {
	'literal-property': {
		pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
		lookbehind: true,
		alias: 'property'
	},
});

if (Prism$1.languages.markup) {
	Prism$1.languages.markup.tag.addInlined('script', 'javascript');

	// add attribute support for all DOM events.
	// https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events
	Prism$1.languages.markup.tag.addAttribute(
		/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
		'javascript'
	);
}

Prism$1.languages.js = Prism$1.languages.javascript;

const globalWindow = window;
function CodeJar(editor, highlight, opt = {}) {
    const options = Object.assign({ tab: '\t', indentOn: /[({\[]$/, moveToNewLine: /^[)}\]]/, spellcheck: false, catchTab: true, preserveIdent: true, addClosing: true, history: true, window: globalWindow }, opt);
    const window = options.window;
    const document = window.document;
    let listeners = [];
    let history = [];
    let at = -1;
    let focus = false;
    let callback;
    let prev; // code content prior keydown event
    editor.setAttribute('contenteditable', 'plaintext-only');
    editor.setAttribute('spellcheck', options.spellcheck ? 'true' : 'false');
    editor.style.outline = 'none';
    editor.style.overflowWrap = 'break-word';
    editor.style.overflowY = 'auto';
    editor.style.whiteSpace = 'pre-wrap';
    let isLegacy = false; // true if plaintext-only is not supported
    highlight(editor);
    if (editor.contentEditable !== 'plaintext-only')
        isLegacy = true;
    if (isLegacy)
        editor.setAttribute('contenteditable', 'true');
    const debounceHighlight = debounce(() => {
        const pos = save();
        highlight(editor, pos);
        restore(pos);
    }, 30);
    let recording = false;
    const shouldRecord = (event) => {
        return !isUndo(event) && !isRedo(event)
            && event.key !== 'Meta'
            && event.key !== 'Control'
            && event.key !== 'Alt'
            && !event.key.startsWith('Arrow');
    };
    const debounceRecordHistory = debounce((event) => {
        if (shouldRecord(event)) {
            recordHistory();
            recording = false;
        }
    }, 300);
    const on = (type, fn) => {
        listeners.push([type, fn]);
        editor.addEventListener(type, fn);
    };
    on('keydown', event => {
        if (event.defaultPrevented)
            return;
        prev = toString();
        if (options.preserveIdent)
            handleNewLine(event);
        else
            legacyNewLineFix(event);
        if (options.catchTab)
            handleTabCharacters(event);
        if (options.addClosing)
            handleSelfClosingCharacters(event);
        if (options.history) {
            handleUndoRedo(event);
            if (shouldRecord(event) && !recording) {
                recordHistory();
                recording = true;
            }
        }
        if (isLegacy)
            restore(save());
    });
    on('keyup', event => {
        if (event.defaultPrevented)
            return;
        if (event.isComposing)
            return;
        if (prev !== toString())
            debounceHighlight();
        debounceRecordHistory(event);
        if (callback)
            callback(toString());
    });
    on('focus', _event => {
        focus = true;
    });
    on('blur', _event => {
        focus = false;
    });
    on('paste', event => {
        recordHistory();
        handlePaste(event);
        recordHistory();
        if (callback)
            callback(toString());
    });
    function save() {
        const s = getSelection();
        const pos = { start: 0, end: 0, dir: undefined };
        let { anchorNode, anchorOffset, focusNode, focusOffset } = s;
        if (!anchorNode || !focusNode)
            throw 'error1';
        // Selection anchor and focus are expected to be text nodes,
        // so normalize them.
        if (anchorNode.nodeType === Node.ELEMENT_NODE) {
            const node = document.createTextNode('');
            anchorNode.insertBefore(node, anchorNode.childNodes[anchorOffset]);
            anchorNode = node;
            anchorOffset = 0;
        }
        if (focusNode.nodeType === Node.ELEMENT_NODE) {
            const node = document.createTextNode('');
            focusNode.insertBefore(node, focusNode.childNodes[focusOffset]);
            focusNode = node;
            focusOffset = 0;
        }
        visit(editor, el => {
            if (el === anchorNode && el === focusNode) {
                pos.start += anchorOffset;
                pos.end += focusOffset;
                pos.dir = anchorOffset <= focusOffset ? '->' : '<-';
                return 'stop';
            }
            if (el === anchorNode) {
                pos.start += anchorOffset;
                if (!pos.dir) {
                    pos.dir = '->';
                }
                else {
                    return 'stop';
                }
            }
            else if (el === focusNode) {
                pos.end += focusOffset;
                if (!pos.dir) {
                    pos.dir = '<-';
                }
                else {
                    return 'stop';
                }
            }
            if (el.nodeType === Node.TEXT_NODE) {
                if (pos.dir != '->')
                    pos.start += el.nodeValue.length;
                if (pos.dir != '<-')
                    pos.end += el.nodeValue.length;
            }
        });
        // collapse empty text nodes
        editor.normalize();
        return pos;
    }
    function restore(pos) {
        const s = getSelection();
        let startNode, startOffset = 0;
        let endNode, endOffset = 0;
        if (!pos.dir)
            pos.dir = '->';
        if (pos.start < 0)
            pos.start = 0;
        if (pos.end < 0)
            pos.end = 0;
        // Flip start and end if the direction reversed
        if (pos.dir == '<-') {
            const { start, end } = pos;
            pos.start = end;
            pos.end = start;
        }
        let current = 0;
        visit(editor, el => {
            if (el.nodeType !== Node.TEXT_NODE)
                return;
            const len = (el.nodeValue || '').length;
            if (current + len > pos.start) {
                if (!startNode) {
                    startNode = el;
                    startOffset = pos.start - current;
                }
                if (current + len > pos.end) {
                    endNode = el;
                    endOffset = pos.end - current;
                    return 'stop';
                }
            }
            current += len;
        });
        if (!startNode)
            startNode = editor, startOffset = editor.childNodes.length;
        if (!endNode)
            endNode = editor, endOffset = editor.childNodes.length;
        // Flip back the selection
        if (pos.dir == '<-') {
            [startNode, startOffset, endNode, endOffset] = [endNode, endOffset, startNode, startOffset];
        }
        s.setBaseAndExtent(startNode, startOffset, endNode, endOffset);
    }
    function beforeCursor() {
        const s = getSelection();
        const r0 = s.getRangeAt(0);
        const r = document.createRange();
        r.selectNodeContents(editor);
        r.setEnd(r0.startContainer, r0.startOffset);
        return r.toString();
    }
    function afterCursor() {
        const s = getSelection();
        const r0 = s.getRangeAt(0);
        const r = document.createRange();
        r.selectNodeContents(editor);
        r.setStart(r0.endContainer, r0.endOffset);
        return r.toString();
    }
    function handleNewLine(event) {
        if (event.key === 'Enter') {
            const before = beforeCursor();
            const after = afterCursor();
            let [padding] = findPadding(before);
            let newLinePadding = padding;
            // If last symbol is "{" ident new line
            if (options.indentOn.test(before)) {
                newLinePadding += options.tab;
            }
            // Preserve padding
            if (newLinePadding.length > 0) {
                preventDefault(event);
                event.stopPropagation();
                insert('\n' + newLinePadding);
            }
            else {
                legacyNewLineFix(event);
            }
            // Place adjacent "}" on next line
            if (newLinePadding !== padding && options.moveToNewLine.test(after)) {
                const pos = save();
                insert('\n' + padding);
                restore(pos);
            }
        }
    }
    function legacyNewLineFix(event) {
        // Firefox does not support plaintext-only mode
        // and puts <div><br></div> on Enter. Let's help.
        if (isLegacy && event.key === 'Enter') {
            preventDefault(event);
            event.stopPropagation();
            if (afterCursor() == '') {
                insert('\n ');
                const pos = save();
                pos.start = --pos.end;
                restore(pos);
            }
            else {
                insert('\n');
            }
        }
    }
    function handleSelfClosingCharacters(event) {
        const open = `([{'"`;
        const close = `)]}'"`;
        const codeAfter = afterCursor();
        const codeBefore = beforeCursor();
        const escapeCharacter = codeBefore.substr(codeBefore.length - 1) === '\\';
        const charAfter = codeAfter.substr(0, 1);
        if (close.includes(event.key) && !escapeCharacter && charAfter === event.key) {
            // We already have closing char next to cursor.
            // Move one char to right.
            const pos = save();
            preventDefault(event);
            pos.start = ++pos.end;
            restore(pos);
        }
        else if (open.includes(event.key)
            && !escapeCharacter
            && (`"'`.includes(event.key) || ['', ' ', '\n'].includes(charAfter))) {
            preventDefault(event);
            const pos = save();
            const wrapText = pos.start == pos.end ? '' : getSelection().toString();
            const text = event.key + wrapText + close[open.indexOf(event.key)];
            insert(text);
            pos.start++;
            pos.end++;
            restore(pos);
        }
    }
    function handleTabCharacters(event) {
        if (event.key === 'Tab') {
            preventDefault(event);
            if (event.shiftKey) {
                const before = beforeCursor();
                let [padding, start,] = findPadding(before);
                if (padding.length > 0) {
                    const pos = save();
                    // Remove full length tab or just remaining padding
                    const len = Math.min(options.tab.length, padding.length);
                    restore({ start, end: start + len });
                    document.execCommand('delete');
                    pos.start -= len;
                    pos.end -= len;
                    restore(pos);
                }
            }
            else {
                insert(options.tab);
            }
        }
    }
    function handleUndoRedo(event) {
        if (isUndo(event)) {
            preventDefault(event);
            at--;
            const record = history[at];
            if (record) {
                editor.innerHTML = record.html;
                restore(record.pos);
            }
            if (at < 0)
                at = 0;
        }
        if (isRedo(event)) {
            preventDefault(event);
            at++;
            const record = history[at];
            if (record) {
                editor.innerHTML = record.html;
                restore(record.pos);
            }
            if (at >= history.length)
                at--;
        }
    }
    function recordHistory() {
        if (!focus)
            return;
        const html = editor.innerHTML;
        const pos = save();
        const lastRecord = history[at];
        if (lastRecord) {
            if (lastRecord.html === html
                && lastRecord.pos.start === pos.start
                && lastRecord.pos.end === pos.end)
                return;
        }
        at++;
        history[at] = { html, pos };
        history.splice(at + 1);
        const maxHistory = 300;
        if (at > maxHistory) {
            at = maxHistory;
            history.splice(0, 1);
        }
    }
    function handlePaste(event) {
        preventDefault(event);
        const text = (event.originalEvent || event)
            .clipboardData
            .getData('text/plain')
            .replace(/\r/g, '');
        const pos = save();
        insert(text);
        highlight(editor);
        restore({
            start: Math.min(pos.start, pos.end) + text.length,
            end: Math.min(pos.start, pos.end) + text.length,
            dir: '<-',
        });
    }
    function visit(editor, visitor) {
        const queue = [];
        if (editor.firstChild)
            queue.push(editor.firstChild);
        let el = queue.pop();
        while (el) {
            if (visitor(el) === 'stop')
                break;
            if (el.nextSibling)
                queue.push(el.nextSibling);
            if (el.firstChild)
                queue.push(el.firstChild);
            el = queue.pop();
        }
    }
    function isCtrl(event) {
        return event.metaKey || event.ctrlKey;
    }
    function isUndo(event) {
        return isCtrl(event) && !event.shiftKey && event.code === 'KeyZ';
    }
    function isRedo(event) {
        return isCtrl(event) && event.shiftKey && event.code === 'KeyZ';
    }
    function insert(text) {
        text = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        document.execCommand('insertHTML', false, text);
    }
    function debounce(cb, wait) {
        let timeout = 0;
        return (...args) => {
            clearTimeout(timeout);
            timeout = window.setTimeout(() => cb(...args), wait);
        };
    }
    function findPadding(text) {
        // Find beginning of previous line.
        let i = text.length - 1;
        while (i >= 0 && text[i] !== '\n')
            i--;
        i++;
        // Find padding of the line.
        let j = i;
        while (j < text.length && /[ \t]/.test(text[j]))
            j++;
        return [text.substring(i, j) || '', i, j];
    }
    function toString() {
        return editor.textContent || '';
    }
    function preventDefault(event) {
        event.preventDefault();
    }
    function getSelection() {
        var _a;
        if (((_a = editor.parentNode) === null || _a === void 0 ? void 0 : _a.nodeType) == Node.DOCUMENT_FRAGMENT_NODE) {
            return editor.parentNode.getSelection();
        }
        return window.getSelection();
    }
    return {
        updateOptions(newOptions) {
            Object.assign(options, newOptions);
        },
        updateCode(code) {
            editor.textContent = code;
            highlight(editor);
        },
        onUpdate(cb) {
            callback = cb;
        },
        toString,
        save,
        restore,
        recordHistory,
        destroy() {
            for (let [type, fn] of listeners) {
                editor.removeEventListener(type, fn);
            }
        },
    };
}

const isPositiveInteger = (input) => {
    input = Number(input);
    if (isNaN(input)) {
        return false;
    }
    return (Number.isInteger(input) && input > 0);
};


/* The original of the followng beast can be admired
 * here: https://stackoverflow.com/a/9337047
 * 
 * For objects it is legal to use "const, if, ..."
 * so this could be removed. A dollar sign though
 * must be inside of a string and was also removed
 * from the original regex. 
 */

/* eslint-disable no-misleading-character-class */
const isIdentifier = (str) => {
    const regex = "^[A-Z_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][A-Z_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$";
    const match = str.match(new RegExp(regex));
    return Boolean(match);
};

/**
 * [contodo]{@link https://github.com/UmamiAppearance/contodo}
 *
 * @version 0.2.0
 * @author UmamiAppearance [mail@umamiappearance.eu]
 * @license GPL-3.0
 */


/**
 * Creates a html node which displays browser console
 * entries. It is possible to mirror the console or 
 * to stop the default console from logging.
 * The methods "console.dir/dirxml" and console.group*
 * are not available. Every other method can be rendered
 * into a document node.
 *
 * Inspired by: https://github.com/bahmutov/console-log-div
 */
class ConTodo {

    /**
     * The constructor sets all options, stores the
     * default console and initializes the document
     * node to a provided patent node. If it is not
     * provided contodo is appended to the body.
     *  
     * @param {object} [node=document.body] - Parent document node. 
     * @param {object} [options] - Options object.
     */
    constructor(node, options={}) {
        
        // Parent Node
        this.parentNode = (node) ? node : document.body;

        // Helper function to test, wether an option
        // was set.
        const hasOption = (key) => Object.prototype.hasOwnProperty.call(options, key);

        // (Default) Options
        this.options = {
            autostart: hasOption("autostart") ? Boolean(options.autostart) : true,
            catchErrors: hasOption("catchErrors") ? Boolean(options.catchErrors) : false,
            height: hasOption("height") ? options.height : "inherit",
            maxEntries: hasOption("maxEntries") ? Math.max(parseInt(Number(options.maxEntries), 10), 0) : 0,
            preventDefault: hasOption("preventDefault") ? Boolean(options.preventDefault) : false,
            reversed: hasOption("reversed") ? Boolean(options.reversed) : false,
            showDebugging: hasOption("showDebugging") ? Boolean(options.showDebugging) : true,
            showTimestamp: hasOption("showTimestamp") ? Boolean(options.showTimestamp) : false,
            width: hasOption("width") ? options.width : "inherit"
        };

        if (typeof defaultCSS === "string") {
            this.options.applyCSS = hasOption("applyCSS") ? Boolean(options.applyCSS) : true;
        } else {
            if (hasOption("applyCSS")) {
                console.warn("Build css is not available. Option 'applyCSS' was ignored.");
            }
            this.options.applyCSS = false;
        }
        
        // Store Default Console Methods
        this.defaultConsole = {
            assert: console.assert.bind(console),
            count: console.count.bind(console),
            countReset: console.countReset.bind(console),
            clear: console.clear.bind(console),
            debug: console.debug.bind(console),
            error: console.error.bind(console),
            exception: console.exception ? console.exception.bind(console) : null,
            info: console.info.bind(console),
            log: console.log.bind(console),
            table: console.table.bind(console),
            time: console.time.bind(console),
            timeEnd: console.timeEnd.bind(console),
            timeLog: console.timeLog.bind(console),
            trace: console.trace.bind(console),
            warn: console.warn.bind(console)
        };
   
        // Class values
        this.active = false;
        this.counters = new Object();
        this.mainElem = null;
        this.style = null;
        this.timers = new Object;

        // Bind Error Function to Class
        this.catchErrorFN = this.catchErrorFN.bind(this);

        // Auto Init
        if (this.options.autostart) {
            this.createDocumentNode();
            this.initFunctions();
        }
    }


    /**
     * Creates the actual node in the document.
     */
    createDocumentNode() {
        if (!this.mainElem) {
            this.mainElem = document.createElement("code");
            this.parentNode.append(this.mainElem);
            this.mainElem.classList.add("contodo");
            this.mainElem.style.height = this.options.height;
            this.logCount = 0;
        }
        if (this.options.applyCSS) {
            this.applyCSS();
        }
    }


    /**
     * Removes contodo node from document
     */
    destroyDocumentNode() {
        if (this.active) {
            this.restoreDefaultConsole();
        }
        if (!this.mainElem) {
            return;
        }
        this.mainElem.remove();
        this.mainElem = null;
    }


    /**
     * Replaces default console methods with
     * contodo methods.
     */
    initFunctions() {
        if (this.active) {
            return;
        }
        console.assert = (bool, ...args) => this.assert(bool, args);
        console.count = (label) => this.count(label);
        console.countReset = (label) => this.countReset(label);
        console.counters = () => this.countersShow();
        console.clear = () => this.clear();
        console.debug = (...args) => this.debug(args);
        console.error = (...args) => this.makeLog("error", args);
        console.exception = console.error;
        console.info = (...args) => this.makeLog("info", args);
        console.log = (...args) => this.makeLog("log", args);
        console.table = (...args) => this.makeTableLog(args);
        console.time = (label) => this.time(label);
        console.timeEnd = (label) => this.timeEnd(label);
        console.timeLog = (label) => this.timeLog(label);
        console.timers = () => this.timersShow();
        console.trace = (...args) => this.trace(args);
        console.warn = (...args) => this.makeLog("warn", args);
        if (this.options.catchErrors) window.addEventListener("error", this.catchErrorFN, false);
        this.active = true;
    }


    /**
     * Restores the console methods.
     */
    restoreDefaultConsole() {
        if (!this.active) {
            return;
        }
        console.assert = this.defaultConsole.assert;
        console.count = this.defaultConsole.count;
        console.countReset = this.defaultConsole.countReset;
        delete console.counters;
        console.clear = this.defaultConsole.clear;
        console.debug = this.defaultConsole.debug;
        console.error = this.defaultConsole.error;
        console.exception = this.defaultConsole.exception;
        console.info = this.defaultConsole.info;
        console.log = this.defaultConsole.log;
        console.table = this.defaultConsole.table;
        console.time = this.defaultConsole.time;
        console.timeEnd = this.defaultConsole.timeEnd;
        console.timeLog = this.defaultConsole.timeLog;
        delete console.timers;
        console.trace = this.defaultConsole.trace;
        console.warn = this.defaultConsole.warn;
        if (this.options.catchErrors) window.removeEventListener("error", this.catchErrorFN, false);
        this.active = false;
    }


    /**
     * Allows the displaying of errors inside of contodo.
     * @param {*} err 
     */
    catchErrorFN(err) {
        this.makeLog(
            "error", 
            [
                "Uncaught",
                err.message,
                "\n",
                `  > ${err.filename}`,
                "\n",
                `  > line ${err.lineno}, colum ${err.colno}`
            ],
            true
        );
    }


    /**
     * Applies CSS to document.
     */
    applyCSS() {
        if (this.style) {
            return;
        }
        this.style = document.createElement("style"); 
        this.style.append(document.createTextNode(defaultCSS));
        document.head.append(this.style);
    }


    /**
     * Removes CSS from document.
     */
    removeCSS() {
        if (!this.style) {
            return;
        }
        this.style.remove();
        this.style = null;
    }


    /**
     * Console[error|info|log|warn] to node. It adds a 
     * symbol at the start of the log for any other than 
     * log and calls if not prevented.
     * It is called by many other methods to generate
     * output. 
     * @param {string} type - error|info|log|warn
     * @param {Array} args - Message arguments.
     * @param {boolean} [preventDefaultLog=this.options.preventDefault] - If true it does not log to the default console.
     */
    makeLog(type, args, preventDefaultLog=this.options.preventDefault) {
        const infoAdder = {
            error: "⛔",
            info: "ⓘ",
            warn: "⚠️"
        };

        if (!preventDefaultLog) {
            this.defaultConsole[type](...args);
        }

        const newLog = this.#makeDivLogEntry(type);
        const lastIndex = args.length-1;

        // An empty log call only logs an empty space.
        // (It has to log something, otherwise the node 
        // would collapse.)
        if (type === "log" && lastIndex < 0) {
            this.#makeSpaceSpan(newLog);
        }
        
        // Every other type than a log gets its leading symbol
        else if (type !== "log") {
            newLog.append(this.#makeEntrySpan("info", infoAdder[type]));
            this.#makeSpaceSpan(newLog);
        }

        // The input is getting analyzed by "#analyzeInputMakeSpan"
        // which also appends the content to the new log. Every node
        // is followed by a space node (except the very last).
        args.forEach((arg, i) => {
            this.#analyzeInputMakeSpan(arg, newLog);

            if (i !== lastIndex) {
                this.#makeSpaceSpan(newLog);
            }
        });

        // Finally scroll to the current log
        this.#scroll();
    }


    /**
     * Prepares the data for a HTML table. The actual
     * node generation is handled by "genHTMLTable",
     * which is called at the end by this prep function.
     * 
     * @param {*} args - Shall be an iterable (otherwise it is a generic log). 
     * @param {*} preventDefaultLog - If true it does not log to the default console.
     */
    makeTableLog(args, preventDefaultLog=this.options.preventDefault) {
        if (!preventDefaultLog) {
            this.defaultConsole.table(...args);
        }

        // Helper function. Test wether the data
        // can be visualized as a table.
        const isIterable = (val) => (typeof val === "object" || (Symbol.iterator in Object(val) && typeof val !== "string"));
        
        let data, cols;
        [data, cols] = args;

        // If it is not possible to create a table from the data,
        // create an ordinary log. (As the default console does)
        if (!isIterable(data)) {
            const msg = (typeof data === "undefined") ? [] : [data];
            this.makeLog("log", msg, true);
        } 
        
        // Deconstruct and prepare the data
        else {
            // Array are converted into objects first
            if (typeof data !== "object") {
                data = Object.assign({}, data);
            }

            // Prepare the columns if not provided
            if (!cols) {
                const colSet = new Set();
                for (let rowKey in data) {
                    let row = data[rowKey];
                    if (!isIterable(row)) {
                        row = [row];
                    }
                    const rowObj = (typeof row !== "object") ? Object.assign({}, row) : row;

                    for (const key in rowObj) {
                        colSet.add(key);
                    } 
                }
                cols = [...colSet];
            }

            // Prepare the header
            let header;
            if (cols.length === 1 && cols[0] == 0) {
                header = ["(Index)", "Value"];
            } else {
                header = ["(Index)", ...cols];
            }

            // Prepare the data
            const tData = [];
            for (const index in data) {
                let row = data[index];
                if (!isIterable(row)) {
                    row = [row];
                }
                const rowObj = (typeof row !== "object") ? Object.assign({}, row) : row;
                const rowArray = [index];

                for (const col of cols) {
                    const colVal = rowObj[col];
                    rowArray.push((colVal === undefined) ? "" : colVal);
                }
                
                tData.push(rowArray);
            }
            
            // Call the html table generation
            this.#genHTMLTable(tData, header);
        }
    }

    /**
     * Creates a new log node and appends it to the
     * contodo main element. 
     * @param {string} [className="log"] - Class name of the log (determines the styling) 
     * @returns {object} - Log Node.
     */
    #makeDivLogEntry(className="log") {        
        let log = document.createElement("div");
        log.classList.add("log", className);

        const dateStr = new Date().toISOString();
        if (this.options.showTimestamp) {
            log.append(this.#makeEntrySpan("time", dateStr));
            log.append("\n");
        }
        log.dataset.date = dateStr;

        this.logCount++;
        let delNode = false;
        if (this.options.maxEntries && this.logCount > this.options.maxEntries) {
            delNode = true;
        }

        if (this.options.reversed) {
            if (delNode) {
                this.mainElem.childNodes[this.options.maxEntries-1].remove();
            }
            this.mainElem.prepend(log);
        } else {
            if (delNode) {
                this.mainElem.childNodes[0].remove();
            }
            this.mainElem.append(log); 
        }

        return log;
    }

    /**
     * Helps to create a classed span inside of the
     * current log (css styled).
     * @param {string} CSSClass - CSS Class of the span elem. 
     * @param {object} content - Span DOM Node.
     * @returns {object} - HTML span node
     */
    #makeEntrySpan(CSSClass, content) {
        const span = document.createElement("span");
        span.classList.add(CSSClass);
        span.textContent = content;
        return span;
    }

    /**
     * Shortcut. Creates a span with the class "space",
     * which contains one space by default.
     * @param {object} log - log node
     * @param {number} [spaces=1] - The amount of spaces.
     */
    #makeSpaceSpan(log, spaces=1) {
        log.append(this.#makeEntrySpan("space", " ".repeat(spaces)));
    }

    /**
     * This error is logged, if the type can't be
     * analyzed. Because of a case, which is not 
     * thought of...
     * @param {*} input - Input Arguments. 
     */
    #foundEdgeCaseError(input) {
        console.error("You found an edge case, which is not covered yet.\nPlease create an issue mentioning your input at:\nhttps://github.com/UmamiAppearance/contodo/issues");
        this.defaultConsole.warn(input);
        
    }

    /**
     * Analyzes the type of a given parameter handed to 
     * the console. It creates a span element with the 
     * required properties. (Can be called recursively)
     * 
     * @param {*} arg - Any input.
     * @param {object} newLog - The current log document node.
     */
    #analyzeInputMakeSpan(arg, newLog) {
        let argType = typeof arg;

        if (argType === "object") {

            // Array and Typed Array
            if (Array.isArray(arg) || (ArrayBuffer.isView(arg) && (arg.constructor.name.match("Array")))) {
                const lastIndex = arg.length - 1;
                newLog.append(this.#makeEntrySpan("object", `${arg.constructor.name} [ `));
                
                arg.forEach((subArg, i) => {
                    let subType = typeof subArg;
                    if (subType === "string") {
                        subArg = `"${subArg}"`;
                        subType = "array-string";
                        newLog.append(this.#makeEntrySpan(subType, subArg));
                    }

                    else {
                        this.#analyzeInputMakeSpan(subArg, newLog);
                    }
                    
                    if (i < lastIndex) {
                        newLog.append(this.#makeEntrySpan("object", ", "));
                    }
                });

                newLog.append(this.#makeEntrySpan("object", " ]"));
            }

            // DataView
            else if (ArrayBuffer.isView(arg)) {
                newLog.append(this.#makeEntrySpan("object", "DataView { buffer: ArrayBuffer, byteLength: "));
                newLog.append(this.#makeEntrySpan("number", arg.byteLength));
                newLog.append(this.#makeEntrySpan("object", ", byteOffset: "));
                newLog.append(this.#makeEntrySpan("number", arg.byteOffset));
                newLog.append(this.#makeEntrySpan("object", " }"));
            }

            // null
            else if (arg === null) {
                newLog.append(this.#makeEntrySpan("null", "null"));
            }
            
            // ArrayBuffer
            else if (arg.constructor.name === "ArrayBuffer") {
                newLog.append(this.#makeEntrySpan("object", "ArrayBuffer { byteLength: "));
                newLog.append(this.#makeEntrySpan("number", arg.byteLength));
                newLog.append(this.#makeEntrySpan("object", " }"));
            }

            // Ordinary Object with key, value pairs
            else if (arg === Object(arg)) {
                newLog.append(this.#makeEntrySpan("object", "Object { "));
                
                const objEntries = Object.entries(arg);
                const lastIndex = objEntries.length - 1;

                // Walk through all entries and call 
                // #analyzeInputMakeSpan recursively
                // for the values
                objEntries.forEach((entry, i) => {
                    entry.forEach((subArg, j) => {
                        let subType = typeof subArg;
                        const isKey = !j;

                        if (subType === "string") {
                            
                            // key
                            if (isKey) {
                                subType = "object";
                                if (isPositiveInteger(subArg)) {
                                    subArg = Number(subArg);
                                } else if (!isIdentifier(subArg)) {
                                    subArg = `"${subArg}"`;
                                }
                            }
                            
                            // value
                            else {
                                subArg = `"${subArg}"`;
                                subType = "array-string";
                            }
                            newLog.append(this.#makeEntrySpan(subType, subArg));
                        }

                        // keys must be strings, this case only applies to values
                        else {
                            this.#analyzeInputMakeSpan(subArg, newLog);
                        }

                        // append a colon after each key
                        if (isKey) {
                            newLog.append(this.#makeEntrySpan("object", ":"));
                            this.#makeSpaceSpan(newLog);
                        }
                    });
                    
                    // add a comma and a space after each key/value pair
                    if (i < lastIndex) {
                        newLog.append(this.#makeEntrySpan("object", ","));
                        this.#makeSpaceSpan(newLog);
                    }
                });

                // close the object with space and curly brace
                newLog.append(this.#makeEntrySpan("object", " }"));
            }
            

            // Unexpected Object Type
            else {
                this.#foundEdgeCaseError(arg);
            }
        }

        // Function
        else if (argType === "function") {
            // cf. https://stackoverflow.com/a/31194949
            let fnStr = Function.toString.call(arg);
            const isClass = Boolean(fnStr.match(/^class/));
            let hasConstructor = true;
            let paramArray;
            
            // Arrow Function
            if (fnStr.match("=>")) {
                paramArray = fnStr
                    .replace(/\s+/g, "")                        // remove all whitespace
                    .replace(/=>.*/, "")                        // remove everything after the arrow
                    .replace(/(\(|\))/g, "")                    // remove brackets
                    .split(",")                                 // split parameters
                    .filter(Boolean);                           // filter [""]
            }
            
            // Class without constructor
            else if (isClass && !fnStr.match("constructor")) {
                hasConstructor = false;
                paramArray = [];
            }
            
            // Class and regular Functions
            else {
                paramArray = fnStr
                    .replace(/\/\/.*$/mg,"")                    // strip single-line comments
                    .replace(/\s+/g, "")                        // strip white space
                    .replace(/\/\*[^/*]*\*\//g, "")             // strip multi-line comments  
                    .split("){", 1)[0].replace(/^[^(]*\(/, "")  // extract the parameters
                    .replace(/=[^,]+/g, "")                     // strip any ES6 defaults 
                    .split(",")                                 // split parameters
                    .filter(Boolean);                           // filter [""]
            }
 
            // Join function arguments
            const params = paramArray.join(", ");
            
            if (isClass) {
                if (hasConstructor) {
                    newLog.append(this.#makeEntrySpan("function", `class ${arg.name} { constructor(`));
                    newLog.append(this.#makeEntrySpan("fn-args", params));
                    newLog.append(this.#makeEntrySpan("function", ") }"));
                } else {
                    newLog.append(this.#makeEntrySpan("function", `class ${arg.name} {}`));
                }
            } else {
                newLog.append(this.#makeEntrySpan("function", `function ${arg.name}(`));
                newLog.append(this.#makeEntrySpan("fn-args", params));
                newLog.append(this.#makeEntrySpan("function", ")"));
            }
        }

        // "undefined"
        else if (argType === "undefined") {
            newLog.append(this.#makeEntrySpan("null", "undefined"));
        }

        else {
            
            // String
            if (argType === "string") {
                // Empty String
                if (arg === "") {
                    arg = "<empty string>";
                }
                // All other strings just pass
            }
            
            // BigInt
            else if (argType === "bigint") {
                arg += "n";
            }
            
            // Symbol
            else if (argType === "symbol") {
                arg = arg.toString().replace("(", "(\"").replace(")", "\")");
            }
            
            // NaN
            else if (isNaN(arg)) {
                argType = "null";
            }

            // type "number" and "boolean" are walking untouched
            // until this point and need no special treatment

            newLog.append(this.#makeEntrySpan(argType, arg));
        }
    }


    /**
     * Creates a HTML table from the given input.
     * (Which must be an array of object to make
     * it work).
     * @param {string[]} data - Table body data.
     * @param {array} header - Table head data.
     */
    #genHTMLTable(data, header) {
        const table = document.createElement("table");
        
        const tHead = document.createElement("thead");
        const trHead = document.createElement("tr");

        for (const head of header) {
            const th = document.createElement("th");
            th.append(document.createTextNode(head));
            trHead.append(th);
        }
        
        tHead.append(trHead);
        table.append(tHead);


        const tBody = document.createElement("tbody");

        for (const row of data) {
            const tr = document.createElement("tr");

            for (const col of row) {
                const td = document.createElement("td");
                td.append(document.createTextNode(col));
                tr.append(td);
            }

            tBody.append(tr);
        }

        table.append(tBody);


        let divLog = this.#makeDivLogEntry();
        divLog.append(table);

        this.#scroll();
    }

    /**
     * Converts the input to a label string.
     * If the input is undefined output will
     * be "default";
     * @param {*} [label] 
     * @returns {string} - label
     */
    #makeLabelStr(label) {
        if (typeof label === "undefined") {
            label = "default";
        } else {
            label = String(label);
        }
        return label;
    }


    /**
     * Scroll a new log into view. 
     */
    #scroll() {
        if (this.options.reversed) {
            this.mainElem.scrollTop = 0;
        } else {
            this.mainElem.scrollTop = this.mainElem.scrollHeight;
        }
    }

    /**
     * console.assert
     * @param {boolean} bool - Result of a comparison 
     * @param {*} [args] - Parameter are appended to the assertion call.
     */
    assert(bool, args) {
        if (!this.options.preventDefault) {
            this.defaultConsole.assert(bool, ...args);
        }
        if (!bool) {
            this.makeLog("error", ["Assertion failed:", ...args], true);
        }
    }

    /**
     * console.count
     * @param {*} [label] - Input gets converted to string. Label is "default" if nothing is passed. 
     */
    count(label) {
        label = this.#makeLabelStr(label);

        if (!this.counters[label]) {
            this.counters[label] = 1;
        } else {
            this.counters[label] ++;
        }
        this.makeLog("log", [`${label}: ${this.counters[label]}`]);
    }

    /**
     * console.countReset
     * @param {*} [label] - Corresponding label.
     */
    countReset(label) {
        label = this.#makeLabelStr(label);
        
        if (Object.prototype.hasOwnProperty.call(this.counters, label)) {
            this.counters[label] = 0;
            this.makeLog("log", [`${label}: ${this.counters[label]}`]);
        } else {
            const msg = `Count for '${label}' does not exist`;
            this.makeLog("warn", [msg]);
        }
        
    }

    /**
     * Bonus feature. Shows all current counters via
     * console.table.
     */
    countersShow() {
        if (Object.keys(this.counters).length) {
            this.makeTableLog([this.counters]);
        }
    }

    /**
     * console.clear
     */
    clear(info=true) {
        if (!this.options.preventDefault && info) {
            this.defaultConsole.clear();
        }
        this.mainElem.innerHTML = "";
        this.logCount = 0;
        if (info) {
            this.makeLog("log", ["Console was cleared"], true);
        }
    }

    /**
     * console.debug
     * Nowadays console.debug and console.log are identical
     * in browsers. With contodo it is possible to only show
     * debug logs if debugging is globally enabled. (Which
     * is the case by default)
     * @param {} args 
     */
    debug(args) {
        if (!this.options.preventDefault) {
            this.defaultConsole.debug(...args);
        }
        if (this.options.showDebugging) {
            this.makeLog("log", args, true);
        }
    }

    /**
     * console.time
     * @param {*} [label] - Input gets converted to string. Label is "default" if nothing is passed. 
     */
    time(label) {
        const now = window.performance.now();
        label = this.#makeLabelStr(label);

        if (!this.timers[label]) {
            this.timers[label] = now;
        } else {
            const msg = `Timer '${label}' already exists`;
            this.makeLog("warn", [msg], true);

            if (!this.options.preventDefault) {
                this.defaultConsole.warn(msg);
            }
        }
    }

    /**
     * console.timeLog and console.timeEnd are 
     * basically the same function. The latter
     * only differs in terms of deleting the 
     * timer. Therefore this helper function 
     * was created. 
     * @param {*} [label] - Corresponding label. 
     * @returns {string} - label
     */
    #timeLogEnd(label) {
        const now = window.performance.now();
        label = this.#makeLabelStr(label);
        const elapsed = now - this.timers[label];

        let msg;
        let type;

        if (this.timers[label]) {
            msg = `${label}: ${elapsed} ms`;
            type = "log";
        } else {
            msg = `Timer '${label}' does not exist`;
            type = "warn";
        }

        this.makeLog(type, [msg], true);
        if (!this.options.preventDefault) {
            this.defaultConsole[type](msg);
        }
        
        return label;
    }

    /**
     * console.timeEnd
     * @param {*} [label] - Corresponding label. 
     */
    timeEnd(label) {
        label = this.#timeLogEnd(label);
        delete this.timers[label];
    }

    /**
     * console.timeEnd
     * @param {*} [label] - Corresponding label. 
     */
    timeLog(label) {
        this.#timeLogEnd(label);
    }

    /**
     * Bonus feature. Shows all current timers via
     * console.table.
     */
    timersShow() {
        const now = window.performance.now();
        const timers = new Object();
        for (const timer in this.timers) {
            timers[timer] = `${now - this.timers[timer]} ms`;
        }
        if (Object.keys(timers).length) {
            this.makeTableLog([timers]);
        }
    }

    /**
     * console.trace
     * This one is a little hacky. It is not
     * possible to call trace directly, as this
     * file and the caller are part of the stack.
     * To reach the aimed goal, a generic Error
     * is thrown and catched to get a stack, which
     * then cleaned up.
     *  
     * @param {*} args 
     */
    trace(args) {
        let stack;
        try {
            throw new Error();
        } catch (err) {
            stack = err.stack;
        }

        const stackArr = [];
        let addLine = false;
        let lenLeft = 0;
        
        stack.split("\n").slice(0, -1).forEach(line => {

            if (!addLine && line.match("console.trace")) {
                addLine = true;
            }
            
            else if (addLine) {
                let name, file;
                [name, file] = line.split("@");
                if (!name) {
                    name = "(anonymous)";
                }
                const len = name.length;
                lenLeft = Math.max(lenLeft, len);
                stackArr.push({name, file, len});
            }
        });

        lenLeft++;

        // html trace
        const newLog = this.#makeDivLogEntry();
        newLog.append(this.#makeEntrySpan("trace-head", "console.trace()"));

        for (const arg of args) {
            this.#makeSpaceSpan(newLog);
            this.#analyzeInputMakeSpan(arg, newLog);
        }

        newLog.append("\n");

        for (const line of stackArr) {
            this.#makeSpaceSpan(newLog);
            newLog.append(this.#makeEntrySpan("trace-name", line.name));
            this.#makeSpaceSpan(newLog, lenLeft-line.len);
            newLog.append(this.#makeEntrySpan("trace-file", line.file));
            newLog.append("\n");
        }

        this.#scroll();
        
        // default console trace
        if (!this.options.preventDefault) {
            const msg = ["%cconsole.trace()", "color:magenta;", ...args, "\n"];
            
            for (const line of stackArr) {
                msg.push(`  ${line.name}${" ".repeat(lenLeft-line.len)}${line.file}\n`);
            }

            this.defaultConsole.log(...msg);
        }
    }
}

var mainCSS = ".contodo{position:inherit;display:block;font-family:monospace;font-size:inherit;min-width:100px;min-height:100px;white-space:break-spaces;overflow:auto;margin:auto;color:#000;scroll-behavior:smooth}.contodo>.log{border-color:rgba(157,157,157,.2);border-width:0 0 1pt 0;border-style:solid;padding:2px 5px}.contodo>.log:first-child{border-width:1pt 0}.contodo>.warn{background-color:#ffff97bb}.contodo>.warn>span.string{color:#505000}.contodo>.error{background-color:#eeaeaebb}.contodo>.error>span.string{color:#640000}.contodo>.time{opacity:.5;font-size:80%}.contodo .null{color:grey}.contodo .bigint,.contodo .boolean,.contodo .number,.contodo .object{color:#32963c}.contodo .array-string,.contodo .fn-args,.contodo .symbol,.contodo .trace-head{color:#f0f}.contodo .function,.contodo .object,.contodo .trace-file{color:#2864fa}.contodo table{width:100%;text-align:left;border-spacing:0;border-collapse:collapse;border:2px #333;border-style:solid none;background-color:#fff}.contodo th,.contodo thead{font-weight:700}.contodo thead>tr,.contodo tr:nth-child(2n){background-color:rgba(200,200,220,.1)}.contodo td,.contodo th{padding:3px 0;border:1px solid rgba(157,157,157,.2);width:1%}div.live-example{font-size:14px;background-color:rgba(244,249,245,.5);min-width:340px;width:80%;margin:.5em auto;padding:.5em}.live-example>.code,.live-example>.contodo,.live-example>div.title-wrapper{border:3px dashed #005}.live-example>.code{min-height:160px;display:flex;flex-direction:row;justify-content:space-between;padding:.5em}.live-example>.code>ol{font-family:monospace;line-height:1.5em;margin:0;background-color:rgba(143,188,143,.7)}.live-example>.code>code{background-color:rgba(100,110,100,.025);padding:0 0 0 5px;display:block;font-size:inherit;white-space:pre!important;width:-webkit-fill-available;width:-moz-available;width:fill-available}.live-example .copy{min-width:26px;min-height:26px;margin:auto 0 0 -26px;background-image:url('data:image/svg+xml;charset=UTF-8,<svg focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"none\" stroke=\"dimgrey\" stroke-width=\"5\" d=\"m 37,30 v -7 c 0,-2.77 2.23,-5 5,-5 h 35 c 2.77,0 5,2.23 5,5 v 35 c 0,2.77 -2.23,5 -5,5 m 0,0 H 70 M 63,42 c 0,-2.77 -1.23,-5 -4,-5 H 23 c -2.77,0 -5,2.23 -5,5 v 35 c 0,2.77 2.23,5 5,5 h 35 c 2.77,0 5,-2.23 5,-5 z\"></path></svg>');background-repeat:no-repeat;background-size:contain;cursor:pointer}.live-example>.code,.live-example>.contodo{background-repeat:no-repeat;background-position:right 10px}.live-example>.code{background-image:url(\"data:image/svg+xml;utf-8,<svg height='120px' width='290px' xmlns='http://www.w3.org/2000/svg' viewBox='-115 0 100 100'><text y='1em' style='font-family: monospace; font-size: 1.2rem; fill: rgba(200, 200, 200, 0.6);'>code</text>\\</svg>\")}.live-example>.contodo{background-image:url(\"data:image/svg+xml;utf-8,<svg height='120px' width='290px' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='1em' style='font-family: monospace; font-size: 1.2rem; fill: rgba(200, 200, 200, 0.6);'>console output</text></svg>\");background-color:transparent;padding:.5em}.live-example>div.title-wrapper{border-width:0 3px;display:flex;justify-content:space-between;padding:.5em}.live-example h1{font-size:1.4em;margin:auto 0}.live-example .controls{display:flex;flex-direction:row;flex-wrap:nowrap}.live-example button{font-weight:500;margin:0 5px;padding:.5em 1em;font-size:1.2em;background-color:rgba(143,188,143,.7);border:2px solid #005;cursor:pointer}.live-example button:hover{background-color:#8fbc8f}.live-example button:active{background-color:#315c31;box-shadow:inset 0 0 0 2px #324d32;color:#fffee0}section#le-copied{position:fixed;margin:auto;display:none;width:100%;text-align:center;top:40%;opacity:0}section#le-copied.show{display:block;animation:show 1.5s cubic-bezier(.8,.03,.58,1)}@keyframes show{50%{opacity:1}}#le-copied article{background-color:#778899;display:inline-block;padding:20px;color:#fff;font-weight:700;border-radius:6px;border:1px solid #d3d3d3;box-shadow:0 0 2px #ccc}@media screen and (max-width:768px){div.live-example{width:calc(100% - 1em)}.live-example h1{font-size:1.3em}.live-example button{padding:.4em .9em}}";

var prismCSS = "code[class*=language-],pre[class*=language-]{color:#111b27;font-family:monospace;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;word-wrap:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none}pre[class*=language-]{padding:1em;margin:.5em 0;overflow:auto}:not(pre)>code[class*=language-]{white-space:normal}.token.cdata,.token.comment,.token.doctype,.token.prolog{color:#800}.token.punctuation{color:#111b27}.token.delimiter.important,.token.selector .parent,.token.tag,.token.tag .token.punctuation{color:#006d6d}.token.attr-name,.token.boolean,.token.boolean.important,.token.constant,.token.number,.token.selector .token.attribute{color:#755f00}.token.class-name,.token.key,.token.parameter,.token.property,.token.property-access,.token.variable{color:#005a8e}.token.attr-value,.token.color,.token.inserted,.token.selector .token.value,.token.string,.token.string .token.url-link{color:#080}.token.builtin,.token.keyword-array,.token.package,.token.regex{color:#af00af}.token.function,.token.selector .token.class,.token.selector .token.id{color:#7c00aa}.token.atrule .token.rule,.token.combinator,.token.keyword,.token.operator,.token.pseudo-class,.token.pseudo-element,.token.selector,.token.unit{color:#008}.token.deleted,.token.important{color:#c22f2e}.token.keyword-this,.token.this{color:#005a8e}.token.bold,.token.important,.token.keyword-this,.token.this{font-weight:700}.token.delimiter.important{font-weight:inherit}.token.italic{font-style:italic}.token.entity{cursor:help}.language-markdown .token.title,.language-markdown .token.title .token.punctuation{color:#005a8e;font-weight:700}.language-markdown .token.blockquote.punctuation{color:#af00af}.language-markdown .token.code{color:#006d6d}.language-markdown .token.hr.punctuation{color:#005a8e}.language-markdown .token.url>.token.content{color:#116b00}.language-markdown .token.url-link{color:#755f00}.language-markdown .token.list.punctuation{color:#af00af}.language-markdown .token.table-header{color:#111b27}.language-json .token.operator{color:#111b27}.language-scss .token.variable{color:#006d6d}";

const css = mainCSS + prismCSS;

class LiveExample {
    
    constructor(node, index, options) {
        const id = node.getAttribute("for") || `live-example-${index+1}`;
        const className = node.getAttribute("class");

        const title = this.getTitle(node, index);
        const code = this.getCode(node);
        if (!code) {
            return null;
        }
        
        const example = this.makeCodeExample(title, code);
        example.id = id;
        example.className = className;

        node.parentNode.insertBefore(example, node);
    }

    getTitle(node, index) {
        const titleNode = node.content.querySelector("h1");
        let title;
        if (!titleNode) {
            title = `Example #${index+1}`;
        } else {
            title = titleNode.textContent;
        }
        return title;
    }

    getCode(node) {
        
        const codeNode = node.content.querySelector("script");
        if (!codeNode) {
            console.warn("Every template needs a script tag with the code to display.");
            return null;
        }
        
        let code = codeNode.innerHTML;
        const pattern = code.match(/\s*\n[\t\s]*/);
        code = code.replace(new RegExp(pattern, "g"), "\n");

        this.evaluate = codeNode.getAttribute("type") === "eval";

        return code.trim();
    };

    makeLineFN(ln) {

        let storedLines = 0;
        
        const updateLines = (code) => {
            const lines = code.split("\n").length;
            if (lines !== storedLines) {
                while (lines < storedLines) {
                    ln.childNodes[lines-1].remove();
                    storedLines --;
                }
                while (lines > storedLines) {
                    ln.append(document.createElement("li"));
                    storedLines ++;
                }
            }
        };

        return updateLines;
    }

    makeToClipboardFN() {
        const toClipboard = (e) => {
            const code = e.target.previousSibling.textContent;
            window.navigator.clipboard.writeText(code);

            const copied = document.querySelector("#le-copied");
            copied.classList.add("show");
            
            setTimeout(() => {
                copied.classList.remove("show");
            }, 1500);
        };
        return toClipboard;
    }

    makeEvalFN() {
        if (this.evaluate) {
            return code => eval(code);
        } else {
            return code => new Function(code)();
        }
    }
    

    makeCodeExample(title, code) { 

        // create new html nodes
        const main = document.createElement("div");

        const codeWrapper = document.createElement("div");
        codeWrapper.className = "code";

        const lineNumbers = document.createElement("ol");
        
        const codeNode = document.createElement("code");
        codeNode.className = "language-js";

        const copyBtn = document.createElement("div");
        copyBtn.className = "copy";
        copyBtn.title = "copy to clipboard";
        const toClipboard = this.makeToClipboardFN();
        copyBtn.addEventListener("click", toClipboard, false);

        codeWrapper.append(lineNumbers);
        codeWrapper.append(codeNode);
        codeWrapper.append(copyBtn);
            

        const titleWrapper = document.createElement("div");
        titleWrapper.className = "title-wrapper";
        
        const titleNode = document.createElement("h1");
        titleNode.textContent = title;

        const controlsWrapper = document.createElement("div");
        controlsWrapper.className = "controls";

        const resetBtn = document.createElement("button");
        resetBtn.textContent = "reset";

        const executeBtn = document.createElement("button");
        executeBtn.textContent = "run";

        controlsWrapper.append(resetBtn);
        controlsWrapper.append(executeBtn);

        titleWrapper.append(titleNode);
        titleWrapper.append(controlsWrapper);


        // initialize jar instance
        const updateLines = this.makeLineFN(lineNumbers);
        const jar = CodeJar(codeNode, (editor) => { Prism.highlightElement(editor); } , {
            tab: " ".repeat(4),
        });

        jar.onUpdate(updateLines);
        updateLines(code);
        jar.updateCode(code);
        
        
        // append nodes to document section
        main.append(codeWrapper);
        main.append(titleWrapper);

        const contodo = new ConTodo(
            main,
            {
                autostart: false,
                catchErrors: true,
                height: "160px",
                preventDefault: true
            }
        );

        contodo.createDocumentNode();
        const evalFN = this.makeEvalFN();
        
        // button methods
        resetBtn.addEventListener("click", () => {
            contodo.clear(false);
            jar.updateCode(code);
            updateLines(code);
        }, false);
        executeBtn.addEventListener("click", () => {
            contodo.clear(false);
            contodo.initFunctions();
            evalFN(jar.toString());
            contodo.restoreDefaultConsole();
        }, false);

        return main;
    };
}

const liveExamples = (() => {

    {
        const style= document.createElement("style"); 
        style.innerHTML = css;
        document.head.append(style);
    }

    const applyNodes = () => {
        const nodes = document.querySelectorAll("template.live-example");
        let i = 0;
        for (const node of nodes) {
            new LiveExample(node, i++);
        }

        const copiedInfo = document.createElement("section");
        copiedInfo.id = "le-copied";

        const copiedInfoText = document.createElement("article");
        copiedInfoText.textContent = "copied to clipboard";

        copiedInfo.append(copiedInfoText);
        document.body.append(copiedInfo);
    };

    if (document.readyState === "complete") {
        applyNodes();
    } else {
        document.addEventListener("DOMContentLoaded", applyNodes, false);
    }
    
})();

export { liveExamples as default };
