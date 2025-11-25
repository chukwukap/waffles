declare module "coinbase-commerce-node" {
  export class Client {
    static init(apiKey: string): void;
  }

  export class Webhook {
    static verifyEventBody(
      rawBody: string,
      signature: string,
      sharedSecret: string
    ): WebhookEvent;
  }

  export interface WebhookEvent {
    id: string;
    type: string;
    data: Charge;
  }

  export interface Charge {
    id: string;
    code: string;
    hosted_url: string;
    metadata?: Record<string, string>;
    timeline?: Array<{
      payment?: {
        transaction_id?: string;
      };
    }>;
  }

  export const resources: {
    Charge: {
      create(data: {
        name: string;
        description: string;
        pricing_type: "fixed_price" | "no_price";
        local_price?: {
          amount: string;
          currency: string;
        };
        metadata?: Record<string, string>;
        redirect_url?: string;
        cancel_url?: string;
      }): Promise<Charge>;
    };
  };
}
