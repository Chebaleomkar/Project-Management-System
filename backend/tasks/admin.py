from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status', 'assignee_email', 'due_date', 'created_at')
    list_filter = ('status', 'project', 'created_at')
    search_fields = ('title', 'description', 'assignee_email', 'project__name')
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
