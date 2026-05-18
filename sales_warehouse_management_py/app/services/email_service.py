"""
Email Service Framework
Supports multiple email providers with a common interface
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

class BaseEmailService(ABC):
    """Abstract base class for email services"""

    @abstractmethod
    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        body: str,
        is_html: bool = False,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Send an email"""
        pass

    @abstractmethod
    async def send_template_email(
        self,
        to_emails: List[str],
        template_id: str,
        template_data: Dict[str, Any],
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Send an email using a template"""
        pass

class SMTPEmailService(BaseEmailService):
    """SMTP email service implementation"""

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_tls = settings.SMTP_TLS

    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        body: str,
        is_html: bool = False,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg['To'] = ", ".join(to_emails)
            msg['Subject'] = subject

            if cc_emails:
                msg['Cc'] = ", ".join(cc_emails)
            if bcc_emails:
                msg['Bcc'] = ", ".join(bcc_emails)

            # Attach body
            msg.attach(MIMEText(body, 'html' if is_html else 'plain'))

            # Attach files if provided
            if attachments:
                for attachment in attachments:
                    with open(attachment['path'], "rb") as attachment_file:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(attachment_file.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename= {attachment["filename"]}',
                        )
                        msg.attach(part)

            # Create SMTP session
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            if self.smtp_tls:
                server.starttls()
            server.login(self.smtp_user, self.smtp_password)

            # Send email
            all_recipients = to_emails + (cc_emails or []) + (bcc_emails or [])
            text = msg.as_string()
            server.sendmail(settings.EMAILS_FROM_EMAIL, all_recipients, text)
            server.quit()

            return {
                "success": True,
                "message": "Email sent successfully",
                "recipients": all_recipients
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def send_template_email(
        self,
        to_emails: List[str],
        template_id: str,
        template_data: Dict[str, Any],
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        # For SMTP, we'd need to implement template rendering
        # This is a simplified version - in practice you'd use Jinja2 or similar
        try:
            # Simple template replacement for demonstration
            body = f"Template ID: {template_id}\nData: {template_data}"
            return await self.send_email(to_emails, f"Template: {template_id}", body, is_html=False,
                                       cc_emails=cc_emails, bcc_emails=bcc_emails)
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

class SendGridEmailService(BaseEmailService):
    """SendGrid email service implementation"""

    def __init__(self):
        self.sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        self.from_email = Email(settings.SENDGRID_FROM_EMAIL)

    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        body: str,
        is_html: bool = False,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        try:
            mail = Mail()
            mail.from_email = self.from_email
            mail.subject = subject

            # Add To recipients
            for to_email in to_emails:
                mail.add_to(To(to_email))

            # Add CC recipients
            if cc_emails:
                for cc_email in cc_emails:
                    mail.add_cc(To(cc_email))

            # Add BCC recipients
            if bcc_emails:
                for bcc_email in bcc_emails:
                    mail.add_bcc(To(bcc_email))

            # Add content
            content_type = "text/html" if is_html else "text/plain"
            mail.add_content(Content(content_type, body))

            # Note: SendGrid attachments would be added here if needed
            # For simplicity, we're skipping attachments in this example

            # Send email
            response = self.sg.send(mail)
            return {
                "success": True,
                "message": "Email sent successfully",
                "status_code": response.status_code,
                "headers": dict(response.headers)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def send_template_email(
        self,
        to_emails: List[str],
        template_id: str,
        template_data: Dict[str, Any],
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        try:
            mail = Mail()
            mail.from_email = self.from_email
            mail.template_id = template_id

            # Add personalization for template data
            personalization = {
                "to": [{"email": email} for email in to_emails],
                "dynamic_template_data": template_data
            }
            mail.add_personalization(personalization)

            # Add CC and BCC if needed
            if cc_emails:
                personalization_cc = {
                    "to": [{"email": email} for email in cc_emails],
                    "dynamic_template_data": template_data
                }
                mail.add_personalization(personalization_cc)

            if bcc_emails:
                personalization_bcc = {
                    "to": [{"email": email} for email in bcc_emails],
                    "dynamic_template_data": template_data
                }
                mail.add_personalization(personalization_bcc)

            # Send email
            response = self.sg.send(mail)
            return {
                "success": True,
                "message": "Template email sent successfully",
                "status_code": response.status_code,
                "headers": dict(response.headers)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

class SESEmailService(BaseEmailService):
    """AWS SES email service implementation"""

    def __init__(self):
        self.ses_client = boto3.client(
            'ses',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.from_email = settings.EMAILS_FROM_EMAIL

    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        body: str,
        is_html: bool = False,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        try:
            # Note: SES has limitations on attachments (must be base64 encoded)
            # For simplicity, we're skipping attachments in this example
            charset = "UTF-8"

            # Create email
            email = {
                'Source': self.from_email,
                'Destination': {
                    'ToAddresses': to_emails,
                    'CcAddresses': cc_emails or [],
                    'BccAddresses': bcc_emails or []
                },
                'Message': {
                    'Subject': {
                        'Data': subject,
                        'Charset': charset
                    },
                    'Body': {
                        'Html' if is_html else 'Text': {
                            'Data': body,
                            'Charset': charset
                        }
                    }
                }
            }

            # Send email
            response = self.ses_client.send_email(**email)
            return {
                "success": True,
                "message": "Email sent successfully",
                "message_id": response['MessageId']
            }
        except ClientError as e:
            return {
                "success": False,
                "error": e.response['Error']['Message']
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def send_template_email(
        self,
        to_emails: List[str],
        template_id: str,
        template_data: Dict[str, Any],
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        try:
            # Note: SES templates require pre-created templates
            # This is a simplified version
            charset = "UTF-8"

            # For demonstration, we'll just send a regular email with template info
            body = f"Template ID: {template_id}\nData: {template_data}"
            email = {
                'Source': self.from_email,
                'Destination': {
                    'ToAddresses': to_emails,
                    'CcAddresses': cc_emails or [],
                    'BccAddresses': bcc_emails or []
                },
                'Message': {
                    'Subject': {
                        'Data': f"Template: {template_id}",
                        'Charset': charset
                    },
                    'Body': {
                        'Text': {
                            'Data': body,
                            'Charset': charset
                        }
                    }
                }
            }

            response = self.ses_client.send_email(**email)
            return {
                "success": True,
                "message": "Template email sent successfully",
                "message_id": response['MessageId']
            }
        except ClientError as e:
            return {
                "success": False,
                "error": e.response['Error']['Message']
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# Factory function to get email service
def get_email_service(provider: str = "smtp") -> BaseEmailService:
    """Factory function to get email service instance"""
    if provider.lower() == "smtp":
        return SMTPEmailService()
    elif provider.lower() == "sendgrid":
        return SendGridEmailService()
    elif provider.lower() == "ses":
        return SESEmailService()
    else:
        raise ValueError(f"Unsupported email provider: {provider}")