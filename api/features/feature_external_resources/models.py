import logging

from django.db import models
from django.db.models import Q
from django_lifecycle import (
    AFTER_SAVE,
    BEFORE_DELETE,
    LifecycleModelMixin,
    hook,
)

from environments.models import Environment
from features.models import Feature, FeatureState
from integrations.github.github import call_github_task
from organisations.models import Organisation
from webhooks.webhooks import WebhookEventType

logger = logging.getLogger(__name__)


class ResourceType(models.TextChoices):
    # GitHub external resource types
    GITHUB_ISSUE = "GITHUB_ISSUE", "GitHub Issue"
    GITHUB_PR = "GITHUB_PR", "GitHub PR"


class FeatureExternalResource(LifecycleModelMixin, models.Model):
    url = models.URLField()
    type = models.CharField(max_length=20, choices=ResourceType.choices)

    # JSON filed containing any metadata related to the external resource
    metadata = models.TextField(null=True)
    feature = models.ForeignKey(
        Feature,
        related_name="external_resources",
        on_delete=models.CASCADE,
    )

    class Meta:
        ordering = ("id",)
        constraints = [
            models.UniqueConstraint(
                fields=["feature", "url"], name="unique_feature_url_constraint"
            )
        ]
        indexes = [
            models.Index(fields=["type"]),
        ]

    @hook(AFTER_SAVE)
    def execute_after_save_actions(self):
        # Add a comment to GitHub Issue/PR when feature is linked to the GH external resource
        if (
            Organisation.objects.prefetch_related("github_config")
            .get(id=self.feature.project.organisation_id)
            .github_config.first()
        ):
            feature_states: list[FeatureState] = []

            environments = Environment.objects.filter(
                project_id=self.feature.project_id
            )

            for environment in environments:
                q = Q(
                    feature_id=self.feature_id,
                    identity__isnull=True,
                )
                feature_states.extend(
                    FeatureState.objects.get_live_feature_states(
                        environment=environment, additional_filters=q
                    )
                )

            call_github_task(
                organisation_id=self.feature.project.organisation_id,
                type=WebhookEventType.FEATURE_EXTERNAL_RESOURCE_ADDED.value,
                feature=self.feature,
                segment_name=None,
                url=None,
                feature_states=feature_states,
            )

    @hook(BEFORE_DELETE)
    def execute_before_save_actions(self) -> None:
        # Add a comment to GitHub Issue/PR when feature is unlinked to the GH external resource
        if (
            Organisation.objects.prefetch_related("github_config")
            .get(id=self.feature.project.organisation_id)
            .github_config.first()
        ):

            call_github_task(
                organisation_id=self.feature.project.organisation_id,
                type=WebhookEventType.FEATURE_EXTERNAL_RESOURCE_REMOVED.value,
                feature=self.feature,
                segment_name=None,
                url=self.url,
                feature_states=None,
            )
