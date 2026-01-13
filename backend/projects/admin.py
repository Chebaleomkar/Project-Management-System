from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'status', 'due_date', 'created_at')
    list_filter = ('status', 'organization', 'created_at')
    search_fields = ('name', 'description', 'organization__name')
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
