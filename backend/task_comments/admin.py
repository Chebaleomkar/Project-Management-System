from django.contrib import admin
from .models import TaskComment


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'author_email', 'content_preview', 'created_at')
    list_filter = ('created_at', 'author_email')
    search_fields = ('content', 'author_email', 'task__title')
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
