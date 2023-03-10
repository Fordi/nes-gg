type NESGameGenieSpec = {
    address: number;
    data: number;
    compare?: number;
};
export declare const decode: (code: string) => NESGameGenieSpec;
export declare const encode: (spec: NESGameGenieSpec) => string;
