import re

with open('src/app/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'export const dynamic' not in content:
    content = content.replace("import { useState, useRef, useEffect } from 'react'", "import { useState, useRef, useEffect } from 'react'\n\nexport const dynamic = 'force-dynamic'")

with open('src/app/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
