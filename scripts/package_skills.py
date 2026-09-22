"""Build a skills-only ZIP without private settings or course artifacts."""
from pathlib import Path
import zipfile, hashlib
root=Path(__file__).resolve().parents[1]
version=(root/'VERSION').read_text().strip()
entries={Path('README.md'):root/'guides/package-readme.md'}
for name in ['INSTALL.md','VERSION','LICENSE','THIRD_PARTY_NOTICES.md','VALIDATION.md']:
    entries[Path(name)]=root/name
for folder in ['skills','guides','examples']:
    for f in (root/folder).rglob('*.md'):
        entries[f.relative_to(root)]=f
(root/'dist').mkdir(exist_ok=True)
archive=root/f'dist/kdev-skills-{version}.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for rel,source in sorted(entries.items()):
        info=zipfile.ZipInfo(str(Path(f'kdev-skills-{version}')/rel),date_time=(2026,9,22,0,0,0))
        info.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(info,source.read_bytes())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert sum(n.endswith('/SKILL.md') for n in z.namelist())==8
    for rel,source in entries.items():
        assert z.read(str(Path(f'kdev-skills-{version}')/rel))==source.read_bytes()
(root/'dist/SHA256SUMS').write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n')
print(archive.name,len(entries),'files verified')
