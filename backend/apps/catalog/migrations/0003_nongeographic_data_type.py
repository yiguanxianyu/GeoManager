from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0002_vector_layer_name_help_text"),
    ]

    operations = [
        migrations.AlterField(
            model_name="dataresource",
            name="data_type",
            field=models.CharField(
                choices=[
                    ("vector", "矢量空间数据"),
                    ("raster", "栅格空间数据"),
                    ("gene", "基因非地理数据"),
                    ("table", "表格属性数据"),
                    ("document", "文档资料"),
                    ("image", "图片资料"),
                ],
                max_length=24,
                verbose_name="数据类型",
            ),
        ),
        migrations.AlterField(
            model_name="dataresource",
            name="storage_path",
            field=models.CharField(
                blank=True,
                help_text="矢量填写 GeoPackage 图层名；栅格相对于地理数据 raster/；基因和表格相对于非地理数据根目录。",
                max_length=255,
                verbose_name="存储相对路径",
            ),
        ),
    ]
