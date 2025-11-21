export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  list?: string;
  //app_metadata: UserAppMetadata;
  //aud: string;
  //created_at: string;
  //user_metadata: CustomUserMetadata;
}

export interface UserSession {
  /**
   * The oauth provider token. If present, this can be used to make external API requests to the oauth provider used.
   */
  provider_token?: string | null
  /**
   * The oauth provider refresh token. If present, this can be used to refresh the provider_token via the oauth provider's API.
   * Not all oauth providers return a provider refresh token. If the provider_refresh_token is missing, please refer to the oauth provider's documentation for information on how to obtain the provider refresh token.
   */
  provider_refresh_token?: string | null
  /**
   * The access token jwt. It is recommended to set the JWT_EXPIRY to a shorter expiry value.
   */
  access_token: string
  /**
   * A one-time used refresh token that never expires.
   */
  refresh_token?: string | null
  /**
   * The number of seconds until the token expires (since it was issued). Returned when a login is confirmed.
   */
  expires_in: number | null
  /**
   * A timestamp of when the token will expire. Returned when a login is confirmed.
   */
  expires_at?: number
  token_type: string
  user?: AuthenticatedUser | null
}

export interface VerifiedUrl {
  status: string;
  url: string;
}

export interface StatusRequest {
  status: string;
}