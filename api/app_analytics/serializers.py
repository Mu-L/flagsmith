import typing

from rest_framework import serializers

from .types import PERIOD_TYPE


class UsageDataSerializer(serializers.Serializer):
    flags = serializers.IntegerField()
    identities = serializers.IntegerField()
    traits = serializers.IntegerField()
    environment_document = serializers.IntegerField()
    day = serializers.CharField()


class UsageDataQuerySerializer(serializers.Serializer):
    project_id = serializers.IntegerField(required=False)
    environment_id = serializers.IntegerField(required=False)
    period = serializers.ChoiceField(
        choices=typing.get_args(PERIOD_TYPE),
        allow_null=True,
        default=None,
        required=False,
    )


class UsageTotalCountSerializer(serializers.Serializer):
    count = serializers.IntegerField()


class SDKAnalyticsFlagsSerializerDetail(serializers.Serializer):
    feature_name = serializers.CharField()
    identity_identifier = serializers.CharField(required=False, default=None)
    enabled_when_evaluated = serializers.BooleanField()
    count = serializers.IntegerField()


class SDKAnalyticsFlagsSerializer(serializers.Serializer):
    evaluations = SDKAnalyticsFlagsSerializerDetail(many=True)
