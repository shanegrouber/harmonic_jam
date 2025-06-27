import os

# Celery Configuration
broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

# Task serialization
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]

# Task execution settings
task_always_eager = False
task_eager_propagates = True

# Worker settings
worker_concurrency = 8  # Number of worker processes
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 1000

# Task settings
task_time_limit = 300  # 5 minutes
task_soft_time_limit = 240  # 4 minutes

# Result backend settings
result_expires = 3600  # 1 hour

# Beat settings (for periodic tasks)
beat_schedule = {}

# Logging
worker_hijack_root_logger = False
worker_log_format = "[%(asctime)s: %(levelname)s/%(processName)s] %(message)s"
worker_task_log_format = "[%(asctime)s: %(levelname)s/%(processName)s] [%(task_name)s(%(task_id)s)] %(message)s"
