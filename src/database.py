import logging
from .firebase import db
from firebase_admin.firestore import FieldFilter

def get_subscription(user) -> list:
    subscription =  db.collection('subscriptions').where(filter=FieldFilter('email', '==', user['email'])).get()
    
    if not subscription:
        return subscription
    
    if len(subscription) > 1:
        logging.warning("Multiple subscriptions found for user", user['email'])
        
    return subscription[0].to_dict()
    