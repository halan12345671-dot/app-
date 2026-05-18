"""
Social Login Service Framework
Supports multiple OAuth providers with a common interface
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import requests
from urllib.parse import urlencode
from app.core.config import settings

class BaseSocialLoginService(ABC):
    """Abstract base class for social login services"""

    @abstractmethod
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """Get the authorization URL for the OAuth provider"""
        pass

    @abstractmethod
    async def get_access_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        pass

    @abstractmethod
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from the access token"""
        pass

class GoogleLoginService(BaseSocialLoginService):
    """Google OAuth login service implementation"""

    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.authorization_url = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_url = "https://oauth2.googleapis.com/token"
        self.user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        self.scopes = ["openid", "email", "profile"]

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "redirect_uri": redirect_uri,
            "state": state,
            "access_type": "offline",
            "prompt": "consent"
        }
        return f"{self.authorization_url}?{urlencode(params)}"

    async def get_access_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        try:
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            }

            response = requests.post(self.token_url, data=data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        try:
            headers = {
                "Authorization": f"Bearer {access_token}"
            }

            response = requests.get(self.user_info_url, headers=headers)
            response.raise_for_status()
            user_info = response.json()

            return {
                "success": True,
                "id": user_info.get("id"),
                "email": user_info.get("email"),
                "first_name": user_info.get("given_name", ""),
                "last_name": user_info.get("family_name", ""),
                "picture": user_info.get("picture"),
                "verified_email": user_info.get("verified_email", False)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

class GitHubLoginService(BaseSocialLoginService):
    """GitHub OAuth login service implementation"""

    def __init__(self):
        self.client_id = settings.GITHUB_CLIENT_ID
        self.client_secret = settings.GITHUB_CLIENT_SECRET
        self.authorization_url = "https://github.com/login/oauth/authorize"
        self.token_url = "https://github.com/login/oauth/access_token"
        self.user_info_url = "https://api.github.com/user"
        self.email_url = "https://api.github.com/user/emails"
        self.scopes = ["read:user", "user:email"]

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "redirect_uri": redirect_uri,
            "state": state
        }
        return f"{self.authorization_url}?{urlencode(params)}"

    async def get_access_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        try:
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            }

            headers = {
                "Accept": "application/json"
            }

            response = requests.post(self.token_url, data=data, headers=headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }

            # Get user profile
            user_response = requests.get(self.user_info_url, headers=headers)
            user_response.raise_for_status()
            user_info = user_response.json()

            # Get user emails (to get the primary email)
            email_response = requests.get(self.email_url, headers=headers)
            email_response.raise_for_status()
            emails = email_response.json()

            # Find primary email
            primary_email = None
            for email in emails:
                if email.get("primary", False) and email.get("verified", False):
                    primary_email = email.get("email")
                    break

            return {
                "success": True,
                "id": str(user_info.get("id")),
                "email": primary_email,
                "first_name": user_info.get("name", "").split()[0] if user_info.get("name") else "",
                "last_name": " ".join(user_info.get("name", "").split()[1:]) if len(user_info.get("name", "").split()) > 1 else "",
                "username": user_info.get("login"),
                "avatar_url": user_info.get("avatar_url")
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# Factory function to get social login service
def get_social_login_service(provider: str) -> BaseSocialLoginService:
    """Factory function to get social login service instance"""
    if provider.lower() == "google":
        return GoogleLoginService()
    elif provider.lower() == "github":
        return GitHubLoginService()
    else:
        raise ValueError(f"Unsupported social login provider: {provider}")