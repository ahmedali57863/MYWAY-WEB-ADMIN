import re

with open('src/app/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = '''      } else if (res?.success) {
        window.location.href = '/'
      }'''

new_code = '''      } else if (res?.success) {
        document.cookie = "hardcoded_admin=true; path=/; max-age=604800";
        window.location.href = '/'
      }'''

content = content.replace(old_code, new_code)

with open('src/app/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
