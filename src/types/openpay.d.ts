declare module "openpay" {
  class Openpay {
    constructor(merchantId: string, privateKey: string, isProductionReady?: boolean);
    setTimeout(ms: number): void;
    setMerchantId(id: string): void;
    setPrivateKey(key: string): void;
    setProductionReady(ready: boolean): void;
    charges: {
      create: (
        data: Record<string, unknown>,
        callback: (error: unknown, charge: Record<string, unknown>) => void
      ) => void;
      get: (
        chargeId: string,
        callback: (error: unknown, charge: Record<string, unknown>) => void
      ) => void;
    };
  }
  export = Openpay;
}
