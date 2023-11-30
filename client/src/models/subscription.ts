export interface Subscription {
  status: string;
  cancelAt: number;
  cancelAtPeriodEnd: boolean;
}

export interface MySubscription {
  portal_url: string;
  subscription: Subscription;
}

export interface CheckoutUrl {
  url: string;
}
