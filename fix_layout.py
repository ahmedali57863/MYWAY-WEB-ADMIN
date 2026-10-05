import sys

path = r'src\app\(admin)\layout.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

search = '''          <Link
            href="/pending-approvals"
            className="block px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors"
          >
            Pending Approvals
          </Link>'''
          
replace = '''          <Link
            href="/pending-approvals"
            className="block px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors"
          >
            Pending Approvals
          </Link>
          <Link
            href="/student-verifications"
            className="block px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors"
          >
            Student Verifications
          </Link>'''

code = code.replace(search, replace)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
