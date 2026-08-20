from django.urls import path
from .views import RegisterView, LoginView, LogoutView, csrf_token_view, UserView, user_roles, SendResetOTPView, VerifyResetOTPView, ResetPasswordWithOTPView
# PasswordResetRequestView, PasswordResetConfirmView
urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path("csrf/", csrf_token_view),
    path("user/", UserView.as_view()),
    path('user-roles/', user_roles, name='user-roles'),
    # path('reset-password-initiate/', PasswordResetRequestView.as_view(), name='password-reset-initiate'),
    # path('reset-password-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('send-reset-otp/', SendResetOTPView.as_view()),
    path('verify-reset-otp/', VerifyResetOTPView.as_view()),
    path('reset-password/', ResetPasswordWithOTPView.as_view()),

]

