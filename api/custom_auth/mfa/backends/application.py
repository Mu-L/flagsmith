from rest_framework.response import Response
from trench.backends.application import ApplicationMessageDispatcher


class CustomApplicationBackend(ApplicationMessageDispatcher):
    def dispatch_message(self):
        original_message = super().dispatch_message()
        data = {
            "qr_link": original_message.data["details"],
            "secret": self._mfa_method.secret,
        }
        return Response(data)

    def validate_code(self, code: str) -> bool:
        return self._get_otp().verify(otp=code, valid_window=20)
