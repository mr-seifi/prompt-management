from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _

class Profile(models.Model):
    """
    Extended user profile model.
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name=_("User")
    )
    bio = models.TextField(_("Bio"), blank=True, default='')
    avatar = models.FileField(
        _("Avatar"), 
        upload_to='avatars/', 
        blank=True, 
        null=True
    )
    created_at = models.DateTimeField(_("Created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated at"), auto_now=True)
    
    class Meta:
        verbose_name = _("Profile")
        verbose_name_plural = _("Profiles")
    
    def __str__(self):
        return f"Profile for {self.user.username}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Signal to automatically create a profile when a user is created.
    """
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Signal to save the profile when the user is saved.
    """
    instance.profile.save()
