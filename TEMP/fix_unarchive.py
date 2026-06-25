import os, json

locales_dir = "F:/AISTUDIO/neumorphic-ui/src/locales"

translations = {
    "de": "Entarchivieren",
    "fr": "Desarchiver",
    "es": "Desarchivar",
    "ja": "\u30a2\u30fc\u30ab\u30a4\u30d6\u89e3\u9664",
    "ko": "\ubcf4\uad00 \ud574\uc81c",
    "zh": "\u53d6\u6d88\u5f52\u6863",
}

for code, trans in translations.items():
    path = os.path.join(locales_dir, code + ".json")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace('"unarchive": true', '"unarchive": "' + trans + '"', 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {code}.json: unarchive = {trans}")
