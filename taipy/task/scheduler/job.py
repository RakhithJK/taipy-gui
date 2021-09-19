__all__ = ["Job", "JobId"]

from dataclasses import dataclass
from typing import NewType

from taipy.task.task_entity import TaskId

JobId = NewType("JobId", str)


@dataclass
class Job:
    id: JobId
    task_id: TaskId