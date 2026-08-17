// Legacy auth endpoint forwarded to new dedicated /api/admin/login
import { POST as loginPOST } from '../login/route';
import { GET as meGET } from '../me/route';

export const POST = loginPOST;
export const GET = meGET;
