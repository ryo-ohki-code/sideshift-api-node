export interface Header_Base {
    "Content-Type": string;
}
export interface Header_With_Token extends Header_Base {
    "x-sideshift-secret": string;
}
export interface Header_Commission extends Header_With_Token {
    commissionRate?: string | undefined;
}
export interface Special_Header extends Header_Commission {
    "x-user-ip"?: string | undefined;
}
export type Headers = Header_Base | Header_With_Token | Header_Commission | Special_Header;
export interface Image_Headers {
    headers: {
        "Accept": "image/svg" | "image/png";
    };
    method: "GET";
}
