from django.test import TestCase

from apps.raster.models import RasterProcessingJob
from apps.raster.services.jobs import _JOBS, _LOCK, _create_job, get_job


class RasterJobPersistenceTests(TestCase):
    def tearDown(self):
        with _LOCK:
            _JOBS.clear()

    def test_job_can_be_reloaded_after_memory_cache_is_cleared(self):
        job = _create_job("import")
        self.assertTrue(RasterProcessingJob.objects.filter(pk=job.id).exists())

        with _LOCK:
            _JOBS.clear()

        restored = get_job(job.id)
        self.assertEqual(restored.id, job.id)
        self.assertEqual(restored.stage, "queued")

    def test_active_cached_job_refreshes_from_newer_persisted_state(self):
        job = _create_job("import")
        RasterProcessingJob.objects.filter(pk=job.id).update(
            status="ready",
            stage="ready",
            progress_percent=100,
            result={"status": "ready"},
        )

        restored = get_job(job.id)

        self.assertEqual(restored.status, "ready")
        self.assertEqual(restored.progress_percent, 100)
        self.assertEqual(restored.result, {"status": "ready"})
