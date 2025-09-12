#!/bin/bash
# fix_links.sh — reescribe href/src a {{ site.baseurl }} y pretty URLs

set -euo pipefail

python3 - <<'PY'
import os, re, io, sys

BASEURL = "{{ site.baseurl }}"

# regex helpers
re_attr_assets = re.compile(r'(?P<attr>href|src)="assets/', re.I)
re_styles     = re.compile(r'(?P<attr>href|src)="styles\.css"', re.I)
re_scripts    = re.compile(r'(?P<attr>href|src)="scripts\.js"', re.I)
re_index_html = re.compile(r'href="index\.html"', re.I)

# href to local *.html (ignore http(s), mailto, tel, #, /absolute already ok)
re_local_html = re.compile(
    r'href="(?!https?:|mailto:|tel:|#)(?P<path>[A-Za-z0-9_\-\/]+)\.html(?P<hash>\#[^"]*)?"',
    re.I
)

def rewrite(content: str) -> str:
    # index.html -> /
    content = re_index_html.sub(f'href="{BASEURL}/"', content)
    # styles/scripts en raíz
    content = re_styles.sub(lambda m: f'{m.group("attr")}="{BASEURL}/styles.css"', content)
    content = re_scripts.sub(lambda m: f'{m.group("attr")}="{BASEURL}/scripts.js"', content)
    # assets/
    content = re_attr_assets.sub(lambda m: f'{m.group("attr")}="{BASEURL}/assets/', content)
    # foo.html -> /foo  (respeta fragmentos #...)
    def repl_local(m):
        path = m.group('path')
        frag = m.group('hash') or ''
        return f'href="{BASEURL}/{path}{frag}"'
    content = re_local_html.sub(repl_local, content)
    return content

for root, dirs, files in os.walk('.'):
    # saltar _site
    if '/_site' in root or root.startswith('./_site'):
        continue
    for name in files:
        if not name.lower().endswith('.html'):
            continue
        path = os.path.join(root, name)
        with io.open(path, 'r', encoding='utf-8') as f:
            original = f.read()
        rewritten = rewrite(original)
        if rewritten != original:
            with io.open(path, 'w', encoding='utf-8') as f:
                f.write(rewritten)
            print("updated:", path)
print("Done.")
PY