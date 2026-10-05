import re

with open('src/app/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the previously injected export const dynamic
content = content.replace("export const dynamic = 'force-dynamic'", "")

# Import Suspense
if 'import { Suspense }' not in content:
    content = content.replace("import { useState, useRef, useEffect } from 'react'", "import { useState, useRef, useEffect, Suspense } from 'react'")

# Rename export default function LoginPage to function LoginContent
content = content.replace("export default function LoginPage() {", "function LoginContent() {")

# Append the new default export at the bottom
new_export = """
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
"""
content += new_export

with open('src/app/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
