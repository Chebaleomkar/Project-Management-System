from django.db import models
from tasks.models import Task


class TaskComment(models.Model):
    """Comment on a task."""
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    content = models.TextField()
    author_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author_email} on {self.task.title}"
