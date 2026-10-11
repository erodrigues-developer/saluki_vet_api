import { SetMetadata } from '@nestjs/common';
export const AUTHENTICATED_KEY = 'authenticatedOnly';
/** Only for routes whose policy is the authenticated identity itself. */
export const Authenticated = () => SetMetadata(AUTHENTICATED_KEY, true);
