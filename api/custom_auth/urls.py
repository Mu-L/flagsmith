from django.urls import include, path
from djoser.views import TokenDestroyView
from rest_framework.routers import DefaultRouter

from custom_auth.views import (
    CustomAuthTokenLoginOrRequestMFACode,
    CustomAuthTokenLoginWithMFACode,
    FFAdminUserViewSet,
    delete_token,
)

app_name = "custom_auth"

ffadmin_user_router = DefaultRouter()
ffadmin_user_router.register(r"users", FFAdminUserViewSet)

urlpatterns = [
    # Override some endpoints for throttling requests and delete user
    path(
        "login/",
        CustomAuthTokenLoginOrRequestMFACode.as_view(),
        name="custom-mfa-authtoken-login",
    ),
    path(
        "login/code/",
        CustomAuthTokenLoginWithMFACode.as_view(),
        name="mfa-authtoken-login-code",
    ),
    path("logout/", TokenDestroyView.as_view(), name="authtoken-logout"),
    path("", include(ffadmin_user_router.urls)),
    path("token/", delete_token, name="delete-token"),
    # NOTE: endpoints provided by `djoser.urls`
    # are deprecated and will be removed in the next Major release
    path("", include("djoser.urls")),
    path("", include("trench.urls")),  # MFA
    path("oauth/", include("custom_auth.oauth.urls")),
]
