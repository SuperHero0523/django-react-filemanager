# Generated by Django 3.0.8 on 2020-07-23 18:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('uploadapp', '0003_auto_20200723_1804'),
    ]

    operations = [
        migrations.AlterField(
            model_name='file',
            name='directory',
            field=models.CharField(default=None, max_length=255, null=True),
        ),
    ]
