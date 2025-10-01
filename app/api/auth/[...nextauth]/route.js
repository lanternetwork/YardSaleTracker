import { authOptions } from '@/utils-property-pulse/authOptions';
import NextAuth from 'next-auth/next';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
