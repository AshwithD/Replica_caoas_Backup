ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

print("✅ ManualCorsMiddleware LOADED")


class ManualCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        print("✅ ManualCorsMiddleware INITIALIZED")

    def __call__(self, request):
        origin = request.META.get('HTTP_ORIGIN', '')

        # Handle preflight OPTIONS request
        if request.method == 'OPTIONS':
            from django.http import HttpResponse
            response = HttpResponse()
            response.status_code = 200

            # Add CORS headers for ANY origin in development
            if origin:
                response['Access-Control-Allow-Origin']      = origin
            else:
                response['Access-Control-Allow-Origin']      = '*'

            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods']     = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers']     = (
                'Accept, Accept-Encoding, Authorization, '
                'Content-Type, DNT, Origin, User-Agent, '
                'X-CSRFToken, X-Requested-With'
            )
            response['Access-Control-Max-Age'] = '86400'
            print(f"✅ OPTIONS response with origin: '{origin}'")
            return response

        # Handle normal requests
        response = self.get_response(request)

        if origin and origin in ALLOWED_ORIGINS:
            response['Access-Control-Allow-Origin']      = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods']     = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers']     = (
                'Accept, Accept-Encoding, Authorization, '
                'Content-Type, DNT, Origin, User-Agent, '
                'X-CSRFToken, X-Requested-With'
            )

        return response