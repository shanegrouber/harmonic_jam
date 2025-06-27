import os

from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("CELERY_CONFIG_MODULE", "backend.celery_config")

# Create the celery app
celery_app = Celery("jam_transfers")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
celery_app.config_from_object("backend.celery_config")

# Explicitly import tasks
celery_app.autodiscover_tasks(["backend.tasks"])

# Explicitly import transfer tasks to ensure they're registered
import backend.tasks.transfer_tasks  # noqa: F401

if __name__ == "__main__":
    celery_app.start()
