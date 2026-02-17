"""
Custom Exception Handler for Django REST Framework
Provides consistent error responses across all API endpoints
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats errors consistently.
    
    Response format:
    {
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message",
            "details": {...}  # Optional additional details
        }
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Log the error
        logger.error(
            f"API Error: {exc.__class__.__name__} - {str(exc)}",
            extra={
                'context': context,
                'status_code': response.status_code
            }
        )
        
        # Format the error response
        error_data = {
            'error': {
                'code': get_error_code(response.status_code),
                'message': get_error_message(response.data),
                'details': response.data if isinstance(response.data, dict) else None
            }
        }
        
        response.data = error_data
    
    return response


def get_error_code(status_code):
    """Map status codes to error codes."""
    error_codes = {
        400: 'VALIDATION_ERROR',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_ALLOWED',
        406: 'NOT_ACCEPTABLE',
        408: 'REQUEST_TIMEOUT',
        409: 'CONFLICT',
        410: 'GONE',
        413: 'PAYLOAD_TOO_LARGE',
        415: 'UNSUPPORTED_MEDIA_TYPE',
        422: 'UNPROCESSABLE_ENTITY',
        429: 'RATE_LIMIT_EXCEEDED',
        500: 'INTERNAL_SERVER_ERROR',
        501: 'NOT_IMPLEMENTED',
        502: 'BAD_GATEWAY',
        503: 'SERVICE_UNAVAILABLE',
        504: 'GATEWAY_TIMEOUT',
    }
    return error_codes.get(status_code, 'UNKNOWN_ERROR')


def get_error_message(data):
    """Extract a human-readable error message from response data."""
    if isinstance(data, str):
        return data
    
    if isinstance(data, list):
        return ' '.join(str(item) for item in data)
    
    if isinstance(data, dict):
        # Common DRF error keys
        for key in ['detail', 'message', 'error', 'non_field_errors']:
            if key in data:
                value = data[key]
                if isinstance(value, list):
                    return ' '.join(str(v) for v in value)
                return str(value)
        
        # Field-specific errors
        field_errors = []
        for field, errors in data.items():
            if isinstance(errors, list):
                field_errors.append(f"{field}: {' '.join(str(e) for e in errors)}")
            else:
                field_errors.append(f"{field}: {errors}")
        
        if field_errors:
            return '; '.join(field_errors)
    
    return 'An unexpected error occurred.'


class APIException(Exception):
    """Base exception for custom API errors."""
    
    def __init__(self, message, code='ERROR', status_code=400, details=None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class ValidationError(APIException):
    """Validation error exception."""
    
    def __init__(self, message, details=None):
        super().__init__(
            message=message,
            code='VALIDATION_ERROR',
            status_code=400,
            details=details
        )


class NotFoundError(APIException):
    """Resource not found exception."""
    
    def __init__(self, message='Resource not found', details=None):
        super().__init__(
            message=message,
            code='NOT_FOUND',
            status_code=404,
            details=details
        )


class PermissionDeniedError(APIException):
    """Permission denied exception."""
    
    def __init__(self, message='Permission denied', details=None):
        super().__init__(
            message=message,
            code='FORBIDDEN',
            status_code=403,
            details=details
        )


class RateLimitError(APIException):
    """Rate limit exceeded exception."""
    
    def __init__(self, message='Rate limit exceeded. Please try again later.', details=None):
        super().__init__(
            message=message,
            code='RATE_LIMIT_EXCEEDED',
            status_code=429,
            details=details
        )
