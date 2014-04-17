/// <reference path="_blocks.ts"/>

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

    /** A page element type */
    export interface ContentData {

        /** Returns the type of data in this content */
        getType(): string

        /** Returns a JSON representation the data in this content */
        getJson(): any
    }

    /** A Page */
    export class Page implements ContentData {
        constructor(
            private title: string,
            private slug: string,
            private content: Blocks.Component[],
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
                json.content.map( Blocks.parse ),
                json.navSort
            );
        }

        /** {@inheritDoc} */
        public getType(): string { return "page"; }

        /** {@inheritDoc} */
        public getJson(): any {
            var json = {
                type: "page",
                title: this.title,
                slug: this.slug,
                content: this.content.map( (c) => c.getJson() )
            };

            if ( this.sort )
                json['navSort'] = this.sort;

            return json;
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

        /** {@inheritDoc} */
        public getType(): string { return "link"; }

        /** {@inheritDoc} */
        public getJson(): any {
            return {
                type: "link",
                text: this.text,
                url: this.url,
                navSort: this.sort
            };
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
                Blocks.parseType<ContentData>( json, {
                    link: RawLink.parse,
                    page: Page.parse
                })
            );
        }

        /** Returns the type of data in this content */
        public getType(): string {
            return this.data.getType();
        }

        /** Returns a JSON representation the data in this content */
        public getJson(): any {
            return this.data.getJson();
        }
    }
}


