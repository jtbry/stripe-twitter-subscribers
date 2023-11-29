from functools import wraps
import os
from flask import Flask, request
from dotenv import load_dotenv
from .stripe import create_checkout_session
import firebase_admin
from firebase_admin import auth
import logging

load_dotenv()

firebase_app = firebase_admin.initialize_app()
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

@app.route('/api/getSubscription')
@require_user
def get_subscription(user):
    return user

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
