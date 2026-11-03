from pathlib import Path
from zipfile import ZIP_STORED, ZipFile, ZipInfo

root = Path(__file__).resolve().parent.parent
target = root / "downloads" / "my-game.zip"
with ZipFile(target, "w", compression=ZIP_STORED) as archive:
    for name in ("index.html", "style.css", "script.js"):
        data = (root / "template" / name).read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
        entry = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
        entry.create_system = 3
        entry.external_attr = 0o100644 << 16
        entry.compress_type = ZIP_STORED
        archive.writestr(entry, data)
print("downloads/my-game.zip を更新しました")
