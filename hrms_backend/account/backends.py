from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Treat the 'username' provided by the authentication system as the email
        email = username # The input from the login form's username field will be the email

        if not email: # If email is still None or empty, return None
            return None

        try:
            # Try to get the user based on the email
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # If no user with that email is found, authentication fails
            return None
        
        # Check the password and if the user can authenticate (e.g., is_active)
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        # If password doesn't match or user cannot authenticate, return None
        return None

    # You don't typically need to override get_user unless you have a very complex setup
    # The default ModelBackend's get_user should work correctly.
    # def get_user(self, user_id):
    #     try:
    #         return User.objects.get(pk=user_id)
    #     except User.DoesNotExist:
    #         return None