from django.test import TestCase

from apps.catalog.models import DataResource, MapLayer
from apps.core.initialization import SUPERADMIN_GROUP_NAME
from apps.raster.models import RasterDataset
from apps.raster.services.catalog_sync import upsert_catalog_records


class RasterCatalogSyncTests(TestCase):
    def test_scanned_raster_resource_has_unknown_uploader_and_superadmin_access(self):
        dataset = RasterDataset.objects.create(
            name="扫描栅格",
            code="scan-raster",
            source_relative_path="source.tif",
            processed_relative_path="processed/source.cog.tif",
            source_file_size=10,
            processed_file_size=20,
            status=RasterDataset.Status.READY,
        )

        resource, layer = upsert_catalog_records(
            dataset=dataset,
            source_info={},
            processed_info={"stac": {"proj:epsg": 3857}},
            default_rules={"mode": "gray", "bands": [1]},
            bounds_4326=[87.0, 43.0, 88.0, 44.0],
        )

        self.assertIsNone(resource.maintainer)
        self.assertEqual(
            set(resource.access_groups.values_list("name", flat=True)),
            {SUPERADMIN_GROUP_NAME},
        )
        self.assertEqual(
            set(layer.access_groups.values_list("name", flat=True)),
            {SUPERADMIN_GROUP_NAME},
        )
        self.assertEqual(resource.data_type, DataResource.DataType.RASTER)
        self.assertEqual(layer.layer_type, MapLayer.LayerType.RASTER)
