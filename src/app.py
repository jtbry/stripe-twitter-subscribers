from functools import wraps
import os
from flask import Flask, request
from dotenv import load_dotenv
from .stripe import create_checkout_session, create_customer_portal, construct_webhook_event, get_customer, get_subscription
from .database import get_user_subscription, delete_subscription, update_subscription
from firebase_admin import auth
import logging

load_dotenv()

app = Flask(__name__)

# This decorator will make any decorated route require authentication
# It will pass the resolved User object as an argument to the route
def require_user(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'X-Auth-Token' not in request.headers:
            return {
                'message': 'Auth token missing'    
            }, 401
            
        try:
            user = auth.verify_id_token(request.headers['X-Auth-Token'])
        except (auth.ExpiredIdTokenError, auth.RevokedIdTokenError, auth.UserDisabledError):
            return {
                'message': 'Not Authorized'
            }, 401
        except Exception as ex:
            logging.exception(ex)
            return {
                'message': 'Unable to Verify ID Token'
            }, 401
        return f(user, *args, **kwargs)
    return decorated

@app.route('/api/getCheckoutLink')
@require_user
def get_checkout_link(user):
    customer_email = user['email']
    if (customer_email is None):
        return {
            'error': 'Must provide customer email'
        }, 400
        
    checkout = create_checkout_session(customer_email)
    return {
        'url': checkout.url
    }

@app.route('/api/getMySubscription')
@require_user
def get_my_subscription(user):
    subscription = get_user_subscription(user)
    if not subscription:
        return {
            'message': 'Subscription Not Found'
        }, 404
        
    portal_url = create_customer_portal(subscription['customerId'])
        
    return {
        'subscription': subscription,
        'portal_url': portal_url
    }

@app.route('/webhook/stripe', methods=['POST'])
def stripe_webhook_listener():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    
    def event_for_subscription(object) -> bool:
        if object['object'] == 'subscription':
            for obj in object['items']:
                if obj['price']['id'] == os.getenv('SUBSCRIPTION_PRICE_ID'):
                    return True
            return False
        elif object['object'] == 'invoice':
            for obj in object['lines']:
                if obj['price']['id'] == os.getenv('SUBSCRIPTION_PRICE_ID'):
                    return True
            return False
        else:
            return False
            
    
    event = None
    try:
        event = construct_webhook_event(payload, sig_header)
    except Exception as ex:
        logging.exception('Unable to construct webhook event', ex)
        return {
            'error': 'Unable to construct webhook event'
        }, 500
    
    try:
        if not event_for_subscription(event.data.object):
            return {
                    'message': 'Ignored event for different product'
                }, 200
            
        if event['type'] == 'customer.subscription.deleted':
            subscription = event.data.object
            delete_subscription(subscription)
        elif event['type'] in ['customer.subscription.created', 'customer.subscription.updated']:
            subscription = event.data.object
            customer = get_customer(subscription['customer'])
            update_subscription(customer['email'], subscription)
        elif event['type'] == 'invoice.paid':
            invoice = event.data.object
            
            if invoice['subscription']:
                subscription = get_subscription(invoice['subscription'])
                update_subscription(invoice['customer_email'], subscription)
        else:
            logging.warn('Unhandled event', event['id'], event['type'])
                
    except Exception as ex:
        logging.exception('Unable to process event', ex)
        return {
            'error': 'Unable to process event'
        }, 500
        
    return {
        'received': True
    }, 200

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
