import { z } from 'zod';

export const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  CONFLICT: 'CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES] | string;

export const oAuthProvidersSchema = z.enum([
  'google',
  'github',
  'apple',
  'discord',
  'facebook',
  'twitter',
  'microsoft',
  'spotify',
  'gitlab',
  'slack',
  'twitch',
  'linkedin',
]);

export const OAuthProvidersSchema = oAuthProvidersSchema;
export type OAuthProvider = z.infer<typeof oAuthProvidersSchema>;
export type PublicOAuthProvider = OAuthProvider;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional().nullable(),
  name: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  country_flag: z.string().optional().nullable(),
});

export type User = z.infer<typeof UserSchema>;
export type UserSchemaType = User;

export interface CreateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface CreateUserResponse {
  user?: User;
  token?: string;
}

export interface CreateSessionRequest {
  email?: string;
  password?: string;
  provider?: string;
}

export interface CreateSessionResponse {
  user?: User;
  token?: string;
  accessToken?: string;
}

export interface SendOTPRequest {
  email?: string;
  phone?: string;
}

export interface RefreshSessionResponse {
  accessToken?: string;
  user?: User;
}

export interface GetCurrentSessionResponse {
  user?: User;
  token?: string;
}

export interface GetProfileResponse {
  user?: User;
}

export interface SendVerificationEmailRequest {
  email: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
}

export interface SendResetPasswordEmailRequest {
  email: string;
}

export interface ExchangeResetPasswordTokenRequest {
  token: string;
  newPassword?: string;
}

export interface ExchangeResetPasswordTokenResponse {
  success: boolean;
}

export interface ResetPasswordResponse {
  success: boolean;
}

export interface GetPublicAuthConfigResponse {
  providers?: string[];
}

export interface GetPublicEmailAuthConfigResponse {
  enabled: boolean;
}

export interface StorageFileSchema {
  id?: string;
  name?: string;
  url?: string;
  key?: string;
  size?: number;
  mime_type?: string;
  created_at?: string;
}

export interface StorageBucketSchema {
  id: string;
  name: string;
  is_public?: boolean;
}

export interface ListObjectsResponseSchema {
  files?: StorageFileSchema[];
}

export interface DeleteObjectsResponse {
  success: boolean;
  deleted?: string[];
}

export interface DeleteObjectResult {
  key: string;
  success: boolean;
}

export interface RealtimeErrorPayload {
  message: string;
  code?: string;
}

export interface SendRawEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface SendEmailResponse {
  id?: string;
  success: boolean;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: Array<{ role: string; content: string }>;
}

export interface ImageGenerationRequest {
  prompt: string;
  n?: number;
  size?: string;
}

export interface EmbeddingsRequest {
  input: string | string[];
  model?: string;
}

export interface SubscribeResponse {
  channel: string;
}

export interface SocketMessage {
  event: string;
  payload?: any;
}

export interface PresenceMember {
  userId: string;
  onlineAt?: string;
  state?: any;
}

export type StripeEnvironment = 'test' | 'live';
export interface CreateCheckoutSessionBody {
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
  [key: string]: any;
}
export interface CreateCheckoutSessionResponse {
  url?: string;
  sessionId?: string;
}
export interface CreateCustomerPortalSessionBody {
  returnUrl?: string;
}
export interface CreateCustomerPortalSessionResponse {
  url?: string;
}

export type RazorpayEnvironment = 'test' | 'live';
export interface CreateRazorpayOrderBody { [key: string]: any; }
export interface CreateRazorpayOrderResponse { [key: string]: any; }
export interface VerifyRazorpayOrderBody { [key: string]: any; }
export interface VerifyRazorpayOrderResponse { [key: string]: any; }
export interface CreateRazorpaySubscriptionBody { [key: string]: any; }
export interface CreateRazorpaySubscriptionResponse { [key: string]: any; }
export interface VerifyRazorpaySubscriptionBody { [key: string]: any; }
export interface VerifyRazorpaySubscriptionResponse { [key: string]: any; }
export interface CancelRazorpaySubscriptionBodyInput { [key: string]: any; }
export interface CancelRazorpaySubscriptionResponse { [key: string]: any; }
export interface PauseRazorpaySubscriptionResponse { [key: string]: any; }
export interface ResumeRazorpaySubscriptionResponse { [key: string]: any; }
export interface AuthErrorResponse {
  message: string;
  error?: string;
  code?: string;
}
