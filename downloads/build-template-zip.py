import argparse
from pathlib import Path
from zipfile import ZIP_STORED, ZipFile, ZipInfo

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument("--output-dir", type=Path, default=root / "downloads")
destination = parser.parse_args().output_dir
names = ("index.html", "style.css", "script.js")


def make_zip(target, source, assets=None):
    target.parent.mkdir(parents=True, exist_ok=True)
    files = [(name, source / name, True) for name in names]
    if assets is not None:
        if not assets.is_dir():
            raise FileNotFoundError(assets)
        files.extend(("assets/" + file.relative_to(assets).as_posix(), file, False)
                     for file in sorted(assets.rglob("*")) if file.is_file())
    with ZipFile(target, "w", compression=ZIP_STORED) as archive:
        for name, file, is_text in files:
            data = file.read_bytes()
            if is_text:
                data = data.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
            entry = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            entry.compress_type = ZIP_STORED
            archive.writestr(entry, data)


make_zip(destination / "my-game.zip", root / "template")
games = sorted((root / "examples").glob("*/*/extensions/tutorial.html"))
for page in games:
    game = page.parent.parent
    complete = game / "complete"
    assets = complete / "assets"
    make_zip(destination / "starters" / f"example-{game.parent.name}-{game.name}-extension.zip", complete, assets if assets.is_dir() else None)

feature_assets = sorted((root / "features").glob("*/*/complete/assets"))
for assets in feature_assets:
    feature = assets.parent.parent
    make_zip(destination / "starters" / f"feature-{feature.parent.name}-{feature.name}.zip", root / "template", assets)

make_zip(destination / "starters" / "coin-catch-complete.zip", root / "tutorial" / "05-game")
demo = root / "learning" / "basics" / "demo"
make_zip(destination / "starters" / "basics-demo.zip", demo, demo / "assets")
for broken in sorted((root / "learning" / "debug").glob("*/broken")):
    assets = broken / "assets"
    make_zip(destination / "starters" / f"debug-{broken.parent.name}.zip", broken, assets if assets.is_dir() else None)

print("ひな型と教材別の開始用ZIPを更新しました")
