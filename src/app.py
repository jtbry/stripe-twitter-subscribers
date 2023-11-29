import os
from flask import Flask, request
from dotenv import load_dotenv
from .stripe import create_checkout_session

load_dotenv()

app = Flask(__name__)

@app.route('/api/getCheckoutLink')
def getCheckoutLink():
    customer_email = request.args.get('email')
    if (customer_email is None):
        return {
            'error': 'Must provide customer email'
        }, 400
        
    checkout = create_checkout_session(customer_email)
    return {
        'url': checkout.url
    }

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
