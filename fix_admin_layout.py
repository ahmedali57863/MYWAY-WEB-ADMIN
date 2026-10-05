import re

with open('src/app/(admin)/layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'export const dynamic' not in content:
    content = "export const dynamic = 'force-dynamic'\n" + content

with open('src/app/(admin)/layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
