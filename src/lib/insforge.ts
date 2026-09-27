import { createClient } from '@insforge/sdk';

export const INSFORGE_BASE_URL = 'https://2y4k8jwr.us-east.insforge.app';
export const INSFORGE_ANON_KEY = 'ik_44baf229fbf982d963b2277e284be487';

export const insforge = createClient({
  baseUrl: INSFORGE_BASE_URL,
  anonKey: INSFORGE_ANON_KEY,
});
