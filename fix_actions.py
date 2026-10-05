import re

with open('src/app/login/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { revalidatePath }' not in content:
    content = content.replace("import { cookies } from 'next/headers'", "import { cookies } from 'next/headers'\nimport { revalidatePath } from 'next/cache'")

with open('src/app/login/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
