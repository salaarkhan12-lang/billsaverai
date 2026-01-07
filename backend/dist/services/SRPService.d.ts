export interface SRPCredentials {
    salt: string;
    verifier: string;
}
export declare class SRPService {
    private readonly N;
    private readonly g;
    private readonly k;
    constructor();
    generateSaltAndVerifier(password: string): SRPCredentials;
    private computeK;
    private computeX;
    private computeVerifier;
    private modPow;
    verifySRPProof(clientPublicKey: string, clientProof: string, serverEphemeral: string, verifier: string): boolean;
    generateServerEphemeral(): {
        publicKey: string;
        privateKey: string;
    };
}
//# sourceMappingURL=SRPService.d.ts.map