"""
Payment Service Framework
Supports multiple payment gateways with a common interface
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import stripe
import paypalrestsdk
from app.core.config import settings

class BasePaymentService(ABC):
    """Abstract base class for payment services"""

    @abstractmethod
    async def process_payment(self, amount: float, currency: str, payment_method_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a payment"""
        pass

    @abstractmethod
    async def refund_payment(self, payment_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund a payment"""
        pass

    @abstractmethod
    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Get payment status"""
        pass

class StripePaymentService(BasePaymentService):
    """Stripe payment service implementation"""

    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY

    async def process_payment(self, amount: float, currency: str, payment_method_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # Convert amount to cents for Stripe
            amount_cents = int(amount * 100)

            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                payment_method=payment_method_data.get("payment_method_id"),
                confirmation_method='manual',
                confirm=True
            )

            return {
                "success": True,
                "payment_id": intent.id,
                "status": intent.status,
                "client_secret": intent.client_secret,
                "amount": amount,
                "currency": currency
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def refund_payment(self, payment_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        try:
            refund_params = {"payment_intent": payment_id}
            if amount is not None:
                refund_params["amount"] = int(amount * 100)  # Convert to cents

            refund = stripe.Refund.create(**refund_params)

            return {
                "success": True,
                "refund_id": refund.id,
                "status": refund.status,
                "amount": amount
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        try:
            intent = stripe.PaymentIntent.retrieve(payment_id)
            return {
                "success": True,
                "payment_id": intent.id,
                "status": intent.status,
                "amount": intent.amount / 100,  # Convert from cents
                "currency": intent.currency
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

class PayPalPaymentService(BasePaymentService):
    """PayPal payment service implementation"""

    def __init__(self):
        paypalrestsdk.configure({
            "mode": "sandbox",  # or "live"
            "client_id": settings.PAYPAL_CLIENT_ID,
            "client_secret": settings.PAYPAL_CLIENT_SECRET
        })

    async def process_payment(self, amount: float, currency: str, payment_method_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": payment_method_data.get("return_url", "http://localhost:3000/payment/success"),
                    "cancel_url": payment_method_data.get("cancel_url", "http://localhost:3000/payment/cancel")
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "Sales & Warehouse Management",
                            "sku": "item",
                            "price": str(amount),
                            "currency": currency,
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "total": str(amount),
                        "currency": currency
                    },
                    "description": "Payment for Sales & Warehouse Management services"
                }]
            })

            if payment.create():
                # Find approval URL
                approval_url = None
                for link in payment.links:
                    if link.rel == "approval_url":
                        approval_url = link.href
                        break

                return {
                    "success": True,
                    "payment_id": payment.id,
                    "approval_url": approval_url,
                    "status": "created"
                }
            else:
                return {
                    "success": False,
                    "error": payment.error
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def refund_payment(self, payment_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        try:
            # Note: PayPal refunds require capturing the payment first
            # This is a simplified implementation
            payment = paypalrestsdk.Payment.find(payment_id)

            if payment.state != "approved":
                return {
                    "success": False,
                    "error": "Payment must be approved before refunding"
                }

            # Find the sale transaction
            sale_id = None
            for transaction in payment.transactions:
                if hasattr(transaction, 'related_resources') and transaction.related_resources:
                    for resource in transaction.related_resources:
                        if hasattr(resource, 'sale'):
                            sale_id = resource.sale.id
                            break
                if sale_id:
                    break

            if not sale_id:
                return {
                    "success": False,
                    "error": "Could not find sale transaction for refund"
                }

            sale = paypalrestsdk.Sale.find(sale_id)

            refund_amount = str(amount) if amount is not None else str(sale.amount.total)

            refund = sale.refund({
                "amount": {
                    "total": refund_amount,
                    "currency": sale.amount.currency
                }
            })

            if refund.success():
                return {
                    "success": True,
                    "refund_id": refund.id,
                    "status": refund.state,
                    "amount": float(refund_amount)
                }
            else:
                return {
                    "success": False,
                    "error": refund.error
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        try:
            payment = paypalrestsdk.Payment.find(payment_id)
            return {
                "success": True,
                "payment_id": payment.id,
                "status": payment.state,
                "amount": float(payment.transactions[0].amount.total) if payment.transactions else 0,
                "currency": payment.transactions[0].amount.currency if payment.transactions else "USD"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# Factory function to get payment service
def get_payment_service(provider: str = "stripe") -> BasePaymentService:
    """Factory function to get payment service instance"""
    if provider.lower() == "stripe":
        return StripePaymentService()
    elif provider.lower() == "paypal":
        return PayPalPaymentService()
    else:
        raise ValueError(f"Unsupported payment provider: {provider}")