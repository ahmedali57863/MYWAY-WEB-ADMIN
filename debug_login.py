import re

with open('src/app/login/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Just replace the entire login function for safety
new_login_func = """export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (email === 'admin' && password === 'admin123') {
    const cookieStore = await cookies();
    cookieStore.set('hardcoded_admin', 'true', { 
      httpOnly: false, 
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    return { success: true }
  }

  return { error: `Invalid admin credentials.` }
}"""

content = re.sub(r'export async function login\(formData: FormData\) \{.*?\n\}', new_login_func, content, flags=re.DOTALL)

with open('src/app/login/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
