/**
 * Shnappy content data
 */
module Shnappy {

    /** Requires that an object contain a list of keys */
    function requireKeys ( json: any, ...keys: string[] ) {
        keys.forEach( (key) => {
            if ( !json[key] ) throw "Missing key: " + key
        });
    }

    /** Parses a typed object against a list of parsing methods */
    function parseType<T> (
        json: any,
        parsers: { [key: string]: (any) => T }
    ): T {
        if ( !json.type ) throw "Object is missing a 'type' property";
        if ( !parsers[json.type] ) throw "Unrecognized type: " + json.type;
        return parsers[json.type]( json );
    }


    /** A single component comprising the content of a page */
    export interface Component {}

    /** The set of page components */
    export module Components {

        /** A piece of markdown content */
        export class Markdown implements Component {
            constructor ( private content: string ) {}

            /** Parses a Markdown Component */
            static parse ( json: any ): Markdown {
                return new Markdown( json.content || "" );
            }
        }

        /** Parses a component */
        export function parse ( json: any ): Component {
            return parseType<Component>(json, {
                markdown: Markdown.parse
            });
        }

    }

    /** A page element type */
    export interface ContentData {}

    /** A Page */
    export class Page implements ContentData {
        constructor(
            private title: string,
            private slug: string,
            private content: Component[],
            private sort?: string
        ) {}

        /** Parses a Page */
        static parse ( json: any ): Page {
            requireKeys(json, "title", "slug", "content");
            if ( !(json.content instanceof Array) )
                throw "Content must be an array"

            return new Page(
                json.title,
                json.slug,
                json.content.map( Components.parse ),
                json.navSort
            );
        }
    }

    /** A RawLink */
    export class RawLink implements ContentData {
        constructor(
            private text: string,
            private url: string,
            private sort: string
        ) {}

        /** Parses a RawLink */
        static parse ( json: any ): RawLink {
            requireKeys(json, "text", "url", "navSort");
            return new RawLink( json.text, json.url, json.navSort );
        }
    }

    /** A piece of page content */
    export class Content {
        constructor (
            private siteID: string,
            private contentID: string,
            private data: ContentData
        ) {}

        /** Parses a Content element */
        static parse ( json: any ): Content {
            requireKeys(json, "siteID", "contentID", "type");
            return new Content(
                json.siteID, json.contentID,
                parseType<ContentData>( json, {
                    link: RawLink.parse,
                    page: Page.parse
                })
            );
        }
    }
}


