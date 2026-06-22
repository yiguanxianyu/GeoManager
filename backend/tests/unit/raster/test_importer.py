from pathlib import Path

from django.test import SimpleTestCase

from apps.raster.services.importer import raster_display_name


class RasterImporterDisplayNameTests(SimpleTestCase):
    def test_explicit_raster_name_is_display_name(self):
        self.assertEqual(
            raster_display_name(
                "Traim",
                Path(
                    "/data/raster/original/uploaded/860dd4f18f4443f69ad42018cd6d452c-Traim.tif"
                ),
                "uploaded/860dd4f18f4443f69ad42018cd6d452c-Traim.tif",
            ),
            "Traim",
        )

    def test_uploaded_raster_fallback_strips_storage_uuid(self):
        self.assertEqual(
            raster_display_name(
                "",
                Path(
                    "/data/raster/original/uploaded/860dd4f18f4443f69ad42018cd6d452c-Traim.tif"
                ),
                "uploaded/860dd4f18f4443f69ad42018cd6d452c-Traim.tif",
            ),
            "Traim",
        )

    def test_non_uploaded_raster_fallback_keeps_source_stem(self):
        self.assertEqual(
            raster_display_name(
                "",
                Path(
                    "/data/raster/original/source/860dd4f18f4443f69ad42018cd6d452c-Traim.tif"
                ),
                "source/860dd4f18f4443f69ad42018cd6d452c-Traim.tif",
            ),
            "860dd4f18f4443f69ad42018cd6d452c-Traim",
        )
