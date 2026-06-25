import os, json

locales_dir = "F:/AISTUDIO/neumorphic-ui/src/locales"

for code in ["de", "fr", "es", "ja", "ko", "zh"]:
    path = os.path.join(locales_dir, code + ".json")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if "unarchive" in content:
        print(f"{code}.json already has unarchive")
        continue
    content = content.replace('"archive":', '"unarchive": true,\n    "archive":', 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Added unarchive to {code}.json")
