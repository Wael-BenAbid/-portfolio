"""
API Error Handling - Comprehensive error handling utilities
Provides consistent error responses across the API
"""
import logging
import traceback
from typing import Dict, Any, Optional, Tuple
from rest_framework import status
from rest_framework.response import Response
from django.conf import settings

logger = logging.getLogger(__name__)


class APIException(Exception):
    """
    Base exception for API errors
    Wraps error details that should be returned to client
    """
    def __init__(
        self,
        message: str,
        code: str = 'API_ERROR',
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_response(self) -> Response:
        """Convert exception to DRF Response"""
        data = {
            'error': {
                'message': self.message,
                'code': self.code,
            }
        }
        if self.details:
            data['error']['details'] = self.details
        return Response(data, status=self.status_code)


class ValidationError(APIException):
    """Input validation error"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(
            message,
            code='VALIDATION_ERROR',
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class AuthenticationError(APIException):
    """Authentication/login failed"""
    def __init__(self, message: str = 'Authentication failed', details: Optional[Dict] = None):
        super().__init__(
            message,
            code='AUTHENTICATION_ERROR',
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )


class AuthorizationError(APIException):
    """User not authorized for this operation"""
    def __init__(self, message: str = 'You do not have permission to perform this action', details: Optional[Dict] = None):
        super().__init__(
            message,
            code='AUTHORIZATION_ERROR',
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )


class NotFoundError(APIException):
    """Resource not found"""
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            f'{resource} not found',
            code='NOT_FOUND',
            status_code=status.HTTP_404_NOT_FOUND,
            details={'resource': resource, 'identifier': str(identifier)}
        )


class ConflictError(APIException):
    """Resource conflict (e.g., duplicate entry)"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(
            message,
            code='CONFLICT',
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


class RateLimitError(APIException):
    """Rate limit exceeded"""
    def __init__(self, message: str = 'Too many requests. Please try again later.'):
        super().__init__(
            message,
            code='RATE_LIMIT_EXCEEDED',
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )


class ExternalServiceError(APIException):
    """External service (OAuth, 3rd party API) failed"""
    def __init__(self, service: str, message: str, details: Optional[Dict] = None):
        full_message = f'{service} error: {message}'
        if details is None:
            details = {}
        details['service'] = service
        super().__init__(
            full_message,
            code='EXTERNAL_SERVICE_ERROR',
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details
        )


class DatabaseError(APIException):
    """Database operation failed"""
    def __init__(self, message: str = 'Database operation failed', details: Optional[Dict] = None):
        super().__init__(
            message,
            code='DATABASE_ERROR',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


class InternalServerError(APIException):
    """Generic internal server error"""
    def __init__(self, message: str = 'An internal server error occurred', details: Optional[Dict] = None):
        super().__init__(
            message,
            code='INTERNAL_SERVER_ERROR',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


# ============= Error Handling Decorators & Context Managers =============

def handle_errors(
    log_level: str = 'error',
    catch_exception: type = Exception,
    default_response: Optional[Dict] = None,
    re_raise: bool = False
):
    """
    Decorator to wrap functions with comprehensive error handling
    
    Usage:
        @handle_errors(log_level='error', catch_exception=Exception)
        def my_function():
            pass
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except APIException:
                # Re-raise API exceptions - they're already formatted
                raise
            except catch_exception as e:
                error_msg = f"Error in {func.__name__}: {str(e)}"
                
                # Log the error with full traceback
                if log_level == 'error':
                    logger.error(error_msg, exc_info=True)
                elif log_level == 'warning':
                    logger.warning(error_msg, exc_info=True)
                else:
                    logger.info(error_msg)
                
                if re_raise:
                    raise
                
                if default_response:
                    return default_response
                return None
        return wrapper
    return decorator


class ErrorHandler:
    """Context manager for safe operation execution"""
    
    def __init__(
        self,
        operation_name: str,
        on_error: str = 'log',  # 'log', 'raise', or 'silent'
        error_response: Optional[Response] = None
    ):
        self.operation_name = operation_name
        self.on_error = on_error
        self.error_response = error_response
        self.error = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            return False
        
        self.error = exc_val
        error_msg = f"{self.operation_name} failed: {str(exc_val)}"
        
        if self.on_error == 'log':
            logger.error(error_msg, exc_info=True)
            return True  # Suppress exception
        elif self.on_error == 'raise':
            logger.error(error_msg, exc_info=True)
            return False  # Re-raise exception
        else:  # silent
            return True  # Suppress exception


# ============= Safe Operation Wrappers =============

def safe_database_operation(
    func,
    *args,
    operation_name: str = 'Database operation',
    **kwargs
) -> Tuple[bool, Any]:
    """
    Safely execute database operation with error handling
    
    Returns:
        Tuple of (success, result)
    
    Usage:
        success, user = safe_database_operation(
            User.objects.get, 
            id=1,
            operation_name='Get user'
        )
    """
    try:
        result = func(*args, **kwargs)
        return True, result
    except Exception as e:
        logger.error(f"{operation_name} failed: {str(e)}", exc_info=True)
        return False, None


def safe_external_request(
    url: str,
    method: str = 'GET',
    timeout: int = 5,
    **kwargs
) -> Tuple[bool, Optional[dict], Optional[str]]:
    """
    Safely make external HTTP request with error handling
    
    Returns:
        Tuple of (success, data, error_message)
    """
    import requests
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, timeout=timeout, **kwargs)
        elif method.upper() == 'POST':
            response = requests.post(url, timeout=timeout, **kwargs)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        if response.status_code == 200:
            return True, response.json(), None
        else:
            error = f"HTTP {response.status_code}: {response.text[:200]}"
            logger.warning(f"External request to {url} failed: {error}")
            return False, None, error
            
    except requests.Timeout:
        error = f"Request timeout (>{timeout}s)"
        logger.error(f"External request to {url} timed out: {error}")
        return False, None, error
    except requests.ConnectionError as e:
        error = f"Connection error: {str(e)}"
        logger.error(f"External request to {url} failed: {error}")
        return False, None, error
    except ValueError as e:
        error = f"Invalid response format: {str(e)}"
        logger.error(f"External request to {url} failed: {error}")
        return False, None, error
    except Exception as e:
        error = f"Unexpected error: {str(e)}"
        logger.error(f"External request to {url} failed: {error}", exc_info=True)
        return False, None, error


def safe_json_parse(data: str, operation_name: str = "JSON parsing") -> Tuple[bool, Optional[dict]]:
    """Safely parse JSON with error handling"""
    import json
    
    try:
        result = json.loads(data)
        return True, result
    except json.JSONDecodeError as e:
        logger.error(f"{operation_name} failed: Invalid JSON - {str(e)}")
        return False, None
    except Exception as e:
        logger.error(f"{operation_name} failed: {str(e)}", exc_info=True)
        return False, None


# ============= Global Exception Handler for DRF Views =============

def api_exception_handler(exc, context):
    """
    Custom exception handler for DRF
    Converts all exceptions to consistent error responses
    
    Add to settings.py:
    REST_FRAMEWORK = {
        'EXCEPTION_HANDLER': 'api.error_handling.api_exception_handler',
    }
    """
    from rest_framework.exceptions import APIException as DRFException
    from rest_framework.response import Response
    
    # Handle our custom API exceptions
    if isinstance(exc, APIException):
        return exc.to_response()
    
    # Handle DRF ValidationError
    if isinstance(exc, DRFException):
        data = {
            'error': {
                'message': getattr(exc, 'detail', str(exc)),
                'code': exc.default_code or 'ERROR',
            }
        }
        return Response(data, status=exc.status_code)
    
    # Handle unexpected exceptions in production
    if not settings.DEBUG:
        logger.error(
            f"Unhandled exception in API: {type(exc).__name__}: {str(exc)}",
            exc_info=True,
            extra={'context': context}
        )
        data = {
            'error': {
                'message': 'An internal server error occurred',
                'code': 'INTERNAL_SERVER_ERROR',
            }
        }
        return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # In DEBUG mode, use default DRF handler
    from rest_framework.views import exception_handler
    return exception_handler(exc, context)
