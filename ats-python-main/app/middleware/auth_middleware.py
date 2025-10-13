"""
JWT Authentication middleware for Python backend.
Handles JWT token validation and company isolation.
"""

import jwt
import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config.settings import settings

logger = logging.getLogger(__name__)

class JWTAuthMiddleware(BaseHTTPMiddleware):
    """JWT Authentication middleware for company isolation."""
    
    def __init__(self, app, secret_key: str = None):
        super().__init__(app)
        # Use the SAME JWT secret as Node.js backend
        self.secret_key = secret_key or settings.JWT_SECRET or "ats-super-secure-jwt-secret-2024-production-ready"
        self.public_routes = [
            "/health",
            "/test-cors", 
            "/test-openai",
            "/startup-status",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/parse-resume",  # Public individual resume parsing for job applications
            "/job-post-embeddings",  # Job embeddings endpoints for testing
            "/api/v1/bulk-processing-status",  # Allow polling without auth issues
            "/api/v1/failed-resumes",  # Allow UI to fetch failed list during debugging
            "/api/v1/bulk-parse-resumes"  # Allow bulk uploads during local testing
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Process request and validate JWT token."""
        
        # Unconditional dev bypass for key bulk endpoints to avoid 401s during local testing
        if settings.DEBUG and (
            request.url.path.startswith("/api/v1/bulk-parse-resumes") or
            request.url.path.startswith("/api/v1/failed-resumes") or
            request.url.path.startswith("/api/v1/bulk-processing-status") or
            request.url.path.startswith("/job-post-embeddings")
        ):
            return await call_next(request)

        # Skip authentication for public routes (prefix match)
        if request.url.path in self.public_routes or any(request.url.path.startswith(route) for route in self.public_routes):
            return await call_next(request)
        
        # Skip authentication for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Get authorization header
        auth_header = request.headers.get("authorization")
        logger.info(f"🔍 Auth Debug - Request: {request.method} {request.url.path}")
        logger.info(f"🔍 Auth Debug - Headers: {dict(request.headers)}")
        logger.info(f"🔍 Auth Debug - Authorization: {auth_header}")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.warning("❌ No valid authorization header found")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Access denied. No token provided."}
            )
        
        try:
            # Extract token
            token = auth_header.split(" ")[1]
            
            # Verify JWT token
            decoded = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            
            # Extract user info from token
            user_id = decoded.get("userId")
            company_id = decoded.get("companyId")
            email = decoded.get("email")
            
            if not user_id or not company_id:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"error": "Invalid token. Missing user or company information."}
                )
            
            # Add user and company info to request state
            request.state.user_id = user_id
            request.state.company_id = company_id
            request.state.user_email = email
            
            logger.info(f"Authenticated user {user_id} from company {company_id}")
            
            # Process request
            response = await call_next(request)
            return response
            
        except jwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Token has expired. Please login again."}
            )
        except jwt.InvalidTokenError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Invalid token."}
            )
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Authentication failed."}
            )

# Security scheme for FastAPI docs
security = HTTPBearer()

def get_current_user(request: Request) -> Dict[str, Any]:
    """Get current user from request state."""
    if not hasattr(request.state, 'user_id'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )
    
    return {
        "user_id": request.state.user_id,
        "company_id": request.state.company_id,
        "email": request.state.user_email
    }

def get_company_id(request: Request) -> int:
    """Get company ID from request state."""
    if not hasattr(request.state, 'company_id'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Company context required"
        )
    
    return request.state.company_id
