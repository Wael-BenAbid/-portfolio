from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0009_projectregistration'),
    ]

    operations = [
        migrations.AddField(
            model_name='mediaitem',
            name='external_url',
            field=models.URLField(blank=True, help_text='Optional remote image/video URL when the asset is already hosted elsewhere', max_length=500, null=True),
        ),
    ]