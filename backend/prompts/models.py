from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
import re
import json

class Prompt(models.Model):
    """
    Model for storing prompts created by users.
    """
    title = models.CharField(_("Title"), max_length=255)
    description = models.TextField(_("Description"))
    variables_schema = models.JSONField(_("Variables Schema"), default=dict, blank=True, 
                                    help_text=_("JSON schema defining the variables used in the template"))
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="prompts",
        verbose_name=_("Created by")
    )
    favorite = models.BooleanField(_("Favorite"), default=False)
    created_at = models.DateTimeField(_("Created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated at"), auto_now=True)
    
    class Meta:
        verbose_name = _("Prompt")
        verbose_name_plural = _("Prompts")
        ordering = ["-created_at"]
    
    def __str__(self):
        return self.title
    
    def render_template(self, variable_values):
        """
        Renders the prompt template by replacing variables with provided values.
        
        Args:
            variable_values (dict): Dictionary mapping variable names to their values
            
        Returns:
            str: The rendered prompt with variables replaced by their values
        """
        rendered_text = self.description
        
        # Replace each variable in the template with its value
        for var_name, var_value in variable_values.items():
            pattern = r'\{\{\s*' + re.escape(var_name) + r'\s*\}\}'
            rendered_text = re.sub(pattern, str(var_value), rendered_text)
            
        return rendered_text
    
    def extract_variables(self):
        """
        Extracts all variables from the prompt description.
        
        Returns:
            list: List of variable names found in the prompt template
        """
        pattern = r'\{\{\s*([a-zA-Z0-9_]+)\s*\}\}'
        matches = re.findall(pattern, self.description)
        return list(set(matches))  # Return unique variable names
