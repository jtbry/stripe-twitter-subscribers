import logging
from firebase import db
from firebase_admin.firestore import FieldFilter

def get_user_subscription(user) -> list:
    doc = db.collection('subscriptions').where(filter=FieldFilter('email', '==', user['email'])).get()
    
    if not doc:
        return doc
    
    if len(doc) > 1:
        logging.warning("Multiple subscriptions found for user", user['email'])
        
    return doc[0].to_dict()
    
def delete_subscription(subscription):
    doc = db.collection('subscriptions').where(filter=FieldFilter('customerId', '==', subscription['customer'])).get()
    if doc:
        doc[0].reference.delete()

def update_subscription(email, subscription):
    doc = db.collection('subscriptions').where(filter=FieldFilter('email', '==', email)).get()
    
    if doc:
        doc[0].reference.update({
          'status': subscription['status'],
          'cancelAt': subscription['cancel_at'],
          'cancelAtPeriodEnd': subscription['cancel_at_period_end'],
        })
    else:
        db[0].collection('subscriptions').add({
          'status': subscription['status'],
          'cancelAt': subscription['cancel_at'],
          'cancelAtPeriodEnd': subscription['cancel_at_period_end'],
        })
