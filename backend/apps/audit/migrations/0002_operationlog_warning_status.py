from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("audit", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="operationlog",
            name="status",
            field=models.CharField(
                choices=[
                    ("success", "成功"),
                    ("warning", "告警"),
                    ("failed", "失败"),
                ],
                max_length=16,
                verbose_name="结果",
            ),
        ),
    ]
