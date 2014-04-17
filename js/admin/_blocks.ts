/**
 * Shnappy content data
 */
module Blocks {

    /** Parses a typed object against a list of parsing methods */
    export function parseType<T> (
        json: any,
        parsers: { [key: string]: (any) => T }
    ): T {
        if ( !json.type ) throw "Object is missing a 'type' property";
        if ( !parsers[json.type] ) throw "Unrecognized type: " + json.type;
        return parsers[json.type]( json );
    }

    /** Parses a component */
    export function parse ( json: any ): Component {
        return parseType<Component>(json, {
            markdown: Markdown.parse,
            html: HTML.parse
        });
    }

    /** A simple observer implementation */
    class EventBus<T> {
        private observers: { (T): void; }[] = [];

        /** Registers a watching callback */
        watch( callback: (T) => void ): EventBus<T> {
            this.observers.push( callback );
            return this;
        }

        /** Registers a watching callback */
        trigger( evt: T ): EventBus<T> {
            this.observers.forEach((callback) => {
                setTimeout(() => callback(evt));
            });
            return this;
        }
    }

    /** A interface for building documents */
    function tag (
        name: string,
        attrs: { [key: string]: string } = {},
        children: any[] = [],
        onCreate: (HTMLElement) => void = null
    ): HTMLElement {
        var elem = document.createElement(name);

        for(var key in attrs) {
            if ( attrs.hasOwnProperty(key) ) {
                elem.setAttribute( key, attrs[key] );
            }
        }

        for(var i = 0, len = children.length; i < len; i++ ) {
            if ( children[i] instanceof Node ) {
                elem.appendChild( <Node> children[i] );
            }
            else {
                elem.appendChild( document.createTextNode( children[i] ) );
            }
        }

        if ( onCreate ) {
            onCreate( elem )
        }

        return elem;
    }

    /** Creates a new document fragment with the given content */
    function fragment( children: Node[] ): Node {
        var elem = document.createDocumentFragment();
        for(var i = 0, len = children.length; i < len; i++ ) {
            elem.appendChild( children[i] );
        }
        return elem;
    }


    /** A single component comprising the content of a page */
    export interface Component {

        /** Returns the type of component */
        getType(): string

        /** Returns a JSON representation the data in this content */
        getJson(): any

        /** Returns the HTML Element needed to edit this component */
        getForm( opts: UIOptions ): Node
    }

    /** A piece of markdown content */
    export class Markdown implements Component {

        /** Parses a Markdown Component */
        static parse ( json: any ): Markdown {
            return new Markdown( json.content || "" );
        }

        /** Monitors any change events */
        private events = new EventBus<Markdown>();

        /** Constructor */
        constructor ( private content: string ) {}

        /** {@inheritDoc} */
        public getType(): string { return "markdown"; }

        /** {@inheritDoc} */
        public getJson(): any {
            return { type: "markdown", content: this.content };
        }

        /** Sets the content of this instance */
        public setContent( content: string ): Markdown {
            if ( this.content !== content ) {
                this.content = content;
                this.events.trigger( this );
            }
            return this;
        }

        /** {@inheritDoc} */
        public getForm( opts: UIOptions ): Node {
            return fragment([
                tag('aside', {}, [
                    tag('a', {
                        href: 'http://daringfireball.net/projects/markdown/syntax'
                    }, [
                        "This field is formatted using markdown"
                    ])
                ]),
                tag('textarea', { class: 'markdown' }, [], (elem) => {
                    elem.addEventListener('change', () => {
                    });
                })
            ]);
        }
    }

    /** A straight piece of HTML */
    export class HTML implements Component {

        /** Parses a Markdown Component */
        static parse ( json: any ): HTML {
            return new HTML( json.content || "" );
        }

        /** Constructor */
        constructor ( private content: string ) {}

        /** Monitors any change events */
        private events = new EventBus<HTML>();

        /** {@inheritDoc} */
        public getType(): string { return "html"; }

        /** {@inheritDoc} */
        public getJson(): any {
            return { type: "html", content: this.content };
        }

        /** Sets the content of this instance */
        public setContent( content: string ): HTML {
            if ( this.content !== content ) {
                this.content = content;
                this.events.trigger( this );
            }
            return this;
        }

        /** {@inheritDoc} */
        public getForm( opts: UIOptions ): Node {
            return tag('div', { class: 'html-editor' }, [],
                (elem: HTMLElement) => {
                    elem.innerHTML = this.content;

                    if ( opts.htmlEditor ) {
                        opts.htmlEditor( elem );
                    }
                }
            );
        }
    }

    /**
     * Options for configuring the UI
     */
    export interface UIOptions {

        /** Hooks up an HTML Editor */
        htmlEditor?: (Node) => void;
    }

    /**
     * Represents the primary UI interface
     */
    export class UI {

        /** The base element */
        private elem: Node;

        /** The configuration for this UI */
        private options: UIOptions;

        /** Constructors */
        constructor( elem: Node, options?: UIOptions );
        constructor( elem: string, options?: UIOptions );
        constructor( input: any, options?: UIOptions ) {
            if ( input instanceof Node ) {
                this.elem = input;
            }
            else {
                this.elem = document.getElementById(input.toString());
            }

            this.options = options || {};
        }

        /** Sets the component data to render */
        public edit( components: Component[] ): void {
            components.forEach((component) => {
                this.elem.appendChild( component.getForm( this.options ) );
            });
        }
    }

}


