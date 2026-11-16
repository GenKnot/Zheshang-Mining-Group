#!/usr/bin/env python3
"""把内容文件里的简体中文（zh-cn）转换成繁体（zh-hk）。

用法：python3 scripts/hant.py lib/data/xxx.src.json lib/data/xxx.json
依赖 macOS 自带的文字转换，只需在修改简体内容后运行一次。
"""
import json, subprocess, sys, tempfile, os

# 逐字转换之后，再把常见用词换成香港的习惯写法
TERMS = [('併發布', '並發佈'), ('併發佈', '並發佈'), ('聯繫', '聯絡'), ('信息', '資訊'), ('項目', '項目'), ('質量', '質素'), ('網絡', '網絡'), ('裡', '裏')]

def to_hant(text):
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(text)
        path = f.name
    js = ('ObjC.import("Foundation");'
          f'var s=$.NSString.stringWithContentsOfFileEncodingError("{path}",4,null);'
          's.stringByApplyingTransformReverse("Hans-Hant",false).js')
    out = subprocess.run(['osascript', '-l', 'JavaScript', '-e', js], capture_output=True, text=True, check=True).stdout
    os.unlink(path)
    out = out.rstrip('\n')
    for a, b in TERMS:
        out = out.replace(a, b)
    return out

def walk(node):
    if isinstance(node, dict):
        if 'zh-cn' in node and 'zh-hk' not in node:
            hk = json.loads(to_hant(json.dumps(node['zh-cn'], ensure_ascii=False)))
            new = {}
            for k, v in node.items():
                new[k] = v
                if k == 'zh-cn':
                    new['zh-hk'] = hk
            node.clear()
            node.update(new)
        for v in node.values():
            walk(v)
    elif isinstance(node, list):
        for v in node:
            walk(v)

src, dst = sys.argv[1], sys.argv[2]
data = json.load(open(src, encoding='utf-8'))
walk(data)
json.dump(data, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok', dst)
