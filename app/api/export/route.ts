import { readFileSync, existsSync, statSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  const exactPath = searchParams.get('path');
  
  let filePath = '';
  if (exactPath) {
    filePath = path.join(process.cwd(), exactPath);
    // basic security to prevent traversal
    if (!filePath.startsWith(process.cwd())) {
        return new Response('Forbidden', { status: 403 });
    }
  } else if (file === 'api') {
    filePath = path.join(process.cwd(), 'app/api/users/route.ts');
  } else if (file === 'page') {
    filePath = path.join(process.cwd(), 'app/(admin)/users/page.tsx');
  } else if (file === 'api_user') {
    filePath = path.join(process.cwd(), 'app/api/users/[username]/route.ts');
  } else if (file === 'api_nas') {
    filePath = path.join(process.cwd(), 'app/api/nas/route.ts');
  } else if (file === 'portal_login') {
    filePath = path.join(process.cwd(), 'app/portal/login/page.tsx');
  } else if (file === 'portal_page') {
    filePath = path.join(process.cwd(), 'app/portal/page.tsx');
  } else if (file === 'lib_db') {
    filePath = path.join(process.cwd(), 'lib/db.ts');
  } else {
    return new Response('Not found', { status: 404 });
  }

  try {
    if (existsSync(filePath) && statSync(filePath).isFile()) {
        const content = readFileSync(filePath, 'utf8');
        return new Response(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    return new Response('File not found', { status: 404 });
  } catch {
    return new Response('Error reading file', { status: 500 });
  }
}
