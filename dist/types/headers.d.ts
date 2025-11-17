export interface Header_Base {
    headers?: {
        "Content-Type": string;
    };
    method?: "GET" | "POST";
}
export interface Header_With_Token extends Header_Base {
    "x-sideshift-secret": string;
}
export interface Header_Commission extends Header_With_Token {
    commissionRate?: string;
}
export type HEADERS = Header_Base | Header_With_Token | Header_Commission;
export interface Special_Header extends Header_Commission {
    "x-user-ip"?: string;
}
export interface Image_Headers {
    headers: {
        "Accept": string;
    };
    method: "GET";
}
//# sourceMappingURL=headers.d.ts.map