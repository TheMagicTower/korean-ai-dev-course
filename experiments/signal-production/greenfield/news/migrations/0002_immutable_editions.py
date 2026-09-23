from django.db import migrations

class Migration(migrations.Migration):
 dependencies=[('news','0001_initial')]
 operations=[migrations.RunSQL("CREATE TRIGGER edition_no_update BEFORE UPDATE ON news_edition BEGIN SELECT RAISE(ABORT, 'published edition is immutable'); END;",'DROP TRIGGER edition_no_update;'),migrations.RunSQL("CREATE TRIGGER edition_no_delete BEFORE DELETE ON news_edition BEGIN SELECT RAISE(ABORT, 'published edition is immutable'); END;",'DROP TRIGGER edition_no_delete;')]
