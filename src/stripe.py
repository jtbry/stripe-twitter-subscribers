import os
import stripe
stripe.api_key = os.getenv('STRIPE_API_KEY')

def create_checkout_session(customer_email: str) -> str: 
    session = stripe.checkout.Session.create(
        mode='subscription',
        payment_method_types=['card'],
        line_items=[
            {
                'price': os.getenv('SUBSCRIPTION_PRICE_ID'),
                'quantity': 1
            }
        ],
        success_url=os.getenv('FRONTEND_URL'),
        cancel_url=os.getenv('FRONTEND_URL'),
        customer_email=customer_email
    )
    
    return session

def create_customer_portal(customer_id: str) -> str:
    portal = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=os.getenv('FRONTEND_URL')
    )
    
    return portal.url