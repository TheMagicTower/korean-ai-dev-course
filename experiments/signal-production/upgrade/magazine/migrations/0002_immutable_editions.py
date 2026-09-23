from django.db import migrations

CREATE_SQL = """
CREATE TRIGGER magazine_edition_no_update
BEFORE UPDATE ON magazine_edition
BEGIN SELECT RAISE(ABORT, 'Published editions are immutable'); END;
CREATE TRIGGER magazine_edition_no_delete
BEFORE DELETE ON magazine_edition
BEGIN SELECT RAISE(ABORT, 'Published editions are immutable'); END;
"""
DROP_SQL = """
DROP TRIGGER IF EXISTS magazine_edition_no_update;
DROP TRIGGER IF EXISTS magazine_edition_no_delete;
"""

class Migration(migrations.Migration):
    dependencies = [('magazine', '0001_initial')]
    operations = [migrations.RunSQL(CREATE_SQL, DROP_SQL)]
