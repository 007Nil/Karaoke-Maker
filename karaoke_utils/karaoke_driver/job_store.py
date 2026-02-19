import threading
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class JobStatus(str, Enum):
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    EXTRACTING = "extracting"
    SEPARATING = "separating"
    ENCODING = "encoding"
    DONE = "done"
    ERROR = "error"


@dataclass
class Job:
    job_id: str
    status: JobStatus = JobStatus.QUEUED
    progress_message: str = "Job queued"
    output_path: Optional[str] = None
    error: Optional[str] = None


class JobStore:
    def __init__(self):
        self._lock = threading.Lock()
        self._jobs: dict[str, Job] = {}

    def create(self, job_id: str) -> Job:
        job = Job(job_id=job_id)
        with self._lock:
            self._jobs[job_id] = job
        return job

    def get(self, job_id: str) -> Optional[Job]:
        with self._lock:
            return self._jobs.get(job_id)

    def update(self, job_id: str, **kwargs) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job:
                for key, value in kwargs.items():
                    setattr(job, key, value)

    def set_done(self, job_id: str, output_path: str) -> None:
        self.update(
            job_id,
            status=JobStatus.DONE,
            progress_message="Karaoke video ready",
            output_path=output_path,
        )

    def set_error(self, job_id: str, error: str) -> None:
        self.update(
            job_id,
            status=JobStatus.ERROR,
            progress_message="Processing failed",
            error=error,
        )


store = JobStore()
