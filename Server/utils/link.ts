export function cleanLink (link: string): string
export function cleanLink (link: undefined): undefined
export function cleanLink (link: string | undefined): string | undefined
export function cleanLink (link: string | undefined): string | undefined {
    // clean link from query parameters and other stuff
    if (link) {
        link = link.split("?")[0];
        link = link.split("#")[0];
    }
    return link;
}