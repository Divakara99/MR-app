import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

type JsonRecord = Record<string, unknown>
type PaidPlanId = 'starter' | 'pro'
type GooglePlayProductType = 'subscription' | 'one-time'
type EntitlementStatus = 'paid' | 'pending' | 'failed'
type VerificationStatus = 'verified' | 'pending' | 'failed'

type ProductMapping = {
  productId: string
  plan: PaidPlanId
  productType: GooglePlayProductType
}

type RemotePurchaseRow = {
  id: string
  role: string
  name: string
  mobile: string
  email: string
  plan: string
  amount_inr: number | string
  method: string
  status: string
  transaction_id: string
  purchased_at: string
  expires_at: string | null
}

type StoredGooglePlayPurchase = {
  product_id: string
  product_type: GooglePlayProductType
  purchase_token: string
  purchase_token_hash: string
}

type GooglePlayConfig = {
  packageName: string
  mappings: ProductMapping[]
  serviceAccount: {
    clientEmail: string
    privateKey: string
  }
}

type VerificationOutcome = {
  status: VerificationStatus
  purchase?: RemotePurchaseRow
  message?: string
  finalizationPending?: boolean
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GOOGLE_PLAY_SCOPE = 'https://www.googleapis.com/auth/androidpublisher'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ANDROID_PUBLISHER_BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'

let cachedGoogleAccessToken: { token: string; expiresAtMs: number } | null = null

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

const jsonResponse = (body: JsonRecord, status = 200): Response => new Response(JSON.stringify(body), {
  status,
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
})

const asRecord = (value: unknown): JsonRecord => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
)

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const getString = (record: JsonRecord, key: string): string => {
  const value = record[key]
  return typeof value === 'string' ? value.trim() : ''
}

const getNumber = (record: JsonRecord, key: string): number | null => {
  const value = record[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

const normalizeProductId = (value: unknown): string => (
  typeof value === 'string' ? value.trim().toLowerCase() : ''
)

const normalizePackageName = (value: unknown): string => (
  typeof value === 'string' ? value.trim().toLowerCase() : ''
)

const isValidPackageName = (value: string): boolean => (
  /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(value)
)

const base64UrlEncode = (value: string | Uint8Array): string => {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

const getSupabaseEnvKey = (dictionaryEnvName: string, legacyEnvName: string): string => {
  const legacyKey = Deno.env.get(legacyEnvName)?.trim()
  if (legacyKey) return legacyKey

  const rawDictionary = Deno.env.get(dictionaryEnvName)?.trim()
  if (!rawDictionary) return ''
  if (!rawDictionary.startsWith('{')) return rawDictionary

  try {
    const parsed = asRecord(JSON.parse(rawDictionary) as unknown)
    const defaultKey = getString(parsed, 'default')
    if (defaultKey) return defaultKey
    for (const value of Object.values(parsed)) {
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  } catch {
    return ''
  }
  return ''
}

const parseServiceAccount = (): GooglePlayConfig['serviceAccount'] | null => {
  const rawJson = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON')?.trim()
  let clientEmail = Deno.env.get('GOOGLE_PLAY_CLIENT_EMAIL')?.trim() ?? ''
  let privateKey = Deno.env.get('GOOGLE_PLAY_PRIVATE_KEY')?.trim() ?? ''

  if (rawJson) {
    try {
      const decoded = rawJson.startsWith('{') ? rawJson : atob(rawJson.replace(/\s+/g, ''))
      const parsed = asRecord(JSON.parse(decoded) as unknown)
      clientEmail = getString(parsed, 'client_email') || clientEmail
      privateKey = getString(parsed, 'private_key') || privateKey
    } catch {
      throw new HttpError(503, 'Google Play server verification is not configured correctly yet. The service-account secret could not be read.')
    }
  }

  privateKey = privateKey.replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n').trim()

  if (!clientEmail || !clientEmail.includes('@') || !privateKey.includes('BEGIN PRIVATE KEY')) {
    return null
  }

  return { clientEmail, privateKey }
}

const loadGooglePlayConfig = async (serviceClient: SupabaseClient): Promise<GooglePlayConfig> => {
  const { data, error } = await serviceClient
    .from('app_settings')
    .select('payload')
    .eq('setting_key', 'commerce')
    .maybeSingle()

  if (error) {
    throw new HttpError(503, 'Google Play Payment Settings could not be loaded from the server.')
  }

  const payload = asRecord(asRecord(data).payload)
  const payment = asRecord(payload.payment)
  const googlePlay = asRecord(payment.googlePlay)

  if (googlePlay.enabled !== true) {
    throw new HttpError(503, 'Google Play Billing is not switched ON in Payment Settings.')
  }

  const settingsPackageName = normalizePackageName(googlePlay.packageName)
  const envPackageName = normalizePackageName(Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME'))

  if (envPackageName && !isValidPackageName(envPackageName)) {
    throw new HttpError(503, 'The Google Play package name secret is invalid.')
  }
  if (settingsPackageName && envPackageName && settingsPackageName !== envPackageName) {
    throw new HttpError(503, 'The Google Play package name in Payment Settings does not match the server secret.')
  }

  const packageName = envPackageName || settingsPackageName
  if (!packageName || !isValidPackageName(packageName)) {
    throw new HttpError(503, 'The final Android package name is not configured for Google Play Billing.')
  }

  const mappings: ProductMapping[] = [
    {
      productId: normalizeProductId(googlePlay.starterSubscriptionId),
      plan: 'starter',
      productType: 'subscription',
    },
    {
      productId: normalizeProductId(googlePlay.starterOneTimeId),
      plan: 'starter',
      productType: 'one-time',
    },
    {
      productId: normalizeProductId(googlePlay.proSubscriptionId),
      plan: 'pro',
      productType: 'subscription',
    },
    {
      productId: normalizeProductId(googlePlay.proOneTimeId),
      plan: 'pro',
      productType: 'one-time',
    },
  ]

  if (mappings.some(mapping => !mapping.productId) || new Set(mappings.map(mapping => mapping.productId)).size !== mappings.length) {
    throw new HttpError(503, 'All four Google Play product IDs must be added once in Payment Settings before purchases can be verified.')
  }

  const serviceAccount = parseServiceAccount()
  if (!serviceAccount) {
    throw new HttpError(503, 'Google Play server verification is not configured yet. Add the Google service-account secret to Supabase before enabling purchases.')
  }

  return { packageName, mappings, serviceAccount }
}

const pemToArrayBuffer = (pem: string): ArrayBuffer => {
  const base64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}

const getGoogleAccessToken = async (config: GooglePlayConfig): Promise<string> => {
  if (cachedGoogleAccessToken && cachedGoogleAccessToken.expiresAtMs > Date.now() + 60_000) {
    return cachedGoogleAccessToken.token
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const unsignedJwt = [
    base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    base64UrlEncode(JSON.stringify({
      iss: config.serviceAccount.clientEmail,
      scope: GOOGLE_PLAY_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    })),
  ].join('.')

  let signature: ArrayBuffer
  try {
    const signingKey = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(config.serviceAccount.privateKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      signingKey,
      new TextEncoder().encode(unsignedJwt),
    )
  } catch {
    throw new HttpError(503, 'Google Play server verification is not configured correctly yet. The service-account key could not be used.')
  }

  const assertion = `${unsignedJwt}.${base64UrlEncode(new Uint8Array(signature))}`
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  if (!response.ok) {
    throw new HttpError(503, 'Google Play server authentication failed. Check the service account and Play Console API access.')
  }

  const tokenPayload = asRecord(await response.json().catch(() => ({})) as unknown)
  const accessToken = getString(tokenPayload, 'access_token')
  const expiresIn = getNumber(tokenPayload, 'expires_in') ?? 3600
  if (!accessToken) {
    throw new HttpError(503, 'Google Play server authentication did not return an access token.')
  }

  cachedGoogleAccessToken = {
    token: accessToken,
    expiresAtMs: Date.now() + Math.max(60, expiresIn - 60) * 1000,
  }
  return accessToken
}

const googlePlayRequest = async (
  config: GooglePlayConfig,
  accessToken: string,
  path: string,
  method: 'GET' | 'POST' = 'GET',
): Promise<JsonRecord> => {
  const response = await fetch(
    `${ANDROID_PUBLISHER_BASE}/${encodeURIComponent(config.packageName)}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(method === 'POST' ? { body: '{}' } : {}),
    },
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new HttpError(400, 'Google Play could not find this purchase for the configured Android package/product.')
    }
    if (response.status === 401 || response.status === 403) {
      throw new HttpError(503, 'The Google service account does not have access to verify purchases for this Play Console app.')
    }
    if (response.status === 429 || response.status >= 500) {
      throw new HttpError(502, 'Google Play verification is temporarily unavailable. Please try Restore Purchase again shortly.')
    }
    throw new HttpError(400, 'Google Play rejected this purchase verification request.')
  }

  if (response.status === 204) return {}
  const text = await response.text()
  if (!text) return {}
  try {
    return asRecord(JSON.parse(text) as unknown)
  } catch {
    return {}
  }
}

const mapApplyError = (error: { message?: string; code?: string }): HttpError => {
  const message = String(error.message ?? '')
  if (message.includes('already linked')) return new HttpError(409, message)
  if (message.includes('not configured') || message.includes('not switched ON')) return new HttpError(503, message)
  if (
    message.includes('Invalid Google Play')
    || message.includes('does not match')
    || message.includes('did not return')
    || message.includes('only to a signed-in Job Seeker')
  ) {
    return new HttpError(400, message)
  }
  if (error.code === 'PGRST202' || message.toLowerCase().includes('function')) {
    return new HttpError(503, 'The Google Play billing database update is not applied yet.')
  }
  return new HttpError(500, 'The verified Google Play purchase could not be saved. Please use Restore Purchase again.')
}

type ApplyPurchaseArgs = {
  productId: string
  purchaseToken: string
  purchaseTokenHash: string
  linkedPurchaseTokenHash: string | null
  orderId: string | null
  latestSuccessfulOrderId: string | null
  googleState: string
  entitlementStatus: EntitlementStatus
  acknowledged: boolean
  consumed: boolean
  purchasedAt: string | null
  expiresAt: string | null
}

const applyGooglePlayPurchase = async (
  serviceClient: SupabaseClient,
  authUserId: string,
  args: ApplyPurchaseArgs,
): Promise<RemotePurchaseRow | undefined> => {
  const { data, error } = await serviceClient.rpc('apply_google_play_purchase', {
    p_auth_user_id: authUserId,
    p_product_id: args.productId,
    p_purchase_token_hash: args.purchaseTokenHash,
    p_purchase_token: args.purchaseToken,
    p_linked_purchase_token_hash: args.linkedPurchaseTokenHash,
    p_order_id: args.orderId,
    p_latest_successful_order_id: args.latestSuccessfulOrderId,
    p_google_state: args.googleState,
    p_entitlement_status: args.entitlementStatus,
    p_acknowledged: args.acknowledged,
    p_consumed: args.consumed,
    p_purchased_at: args.purchasedAt,
    p_expires_at: args.expiresAt,
  })

  if (error) throw mapApplyError(error)
  const rows = asArray(data)
  return rows.length > 0 ? rows[0] as RemotePurchaseRow : undefined
}

const markGooglePlayFinalized = async (
  serviceClient: SupabaseClient,
  authUserId: string,
  purchaseTokenHash: string,
  acknowledged: boolean,
  consumed: boolean,
  googleState: string,
): Promise<void> => {
  const { error } = await serviceClient.rpc('mark_google_play_purchase_finalized', {
    p_auth_user_id: authUserId,
    p_purchase_token_hash: purchaseTokenHash,
    p_acknowledged: acknowledged,
    p_consumed: consumed,
    p_google_state: googleState,
  })
  if (error) throw mapApplyError(error)
}

const outcomeFromAppliedPurchase = (
  status: VerificationStatus,
  purchase: RemotePurchaseRow | undefined,
  pendingMessage: string,
  failedMessage: string,
): VerificationOutcome => {
  if (status === 'verified') return { status, purchase }
  return {
    status,
    purchase,
    message: status === 'pending' ? pendingMessage : failedMessage,
  }
}

const verifySubscription = async (
  serviceClient: SupabaseClient,
  config: GooglePlayConfig,
  accessToken: string,
  authUserId: string,
  mapping: ProductMapping,
  purchaseToken: string,
): Promise<VerificationOutcome> => {
  const purchaseTokenHash = await sha256Hex(purchaseToken)
  const subscription = await googlePlayRequest(
    config,
    accessToken,
    `/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
  )

  const googleState = getString(subscription, 'subscriptionState')
  const lineItems = asArray(subscription.lineItems).map(asRecord)
  const lineItem = lineItems.find(item => normalizeProductId(item.productId) === mapping.productId)

  if (!lineItem) {
    throw new HttpError(400, 'This Google Play purchase token does not belong to the selected subscription product.')
  }

  const expiresAt = getString(lineItem, 'expiryTime') || null
  const latestSuccessfulOrderId = getString(lineItem, 'latestSuccessfulOrderId')
    || getString(subscription, 'latestOrderId')
    || null
  const orderId = latestSuccessfulOrderId || getString(subscription, 'latestOrderId') || null
  const acknowledged = getString(subscription, 'acknowledgementState') === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED'
  const linkedPurchaseToken = getString(subscription, 'linkedPurchaseToken')
  const linkedPurchaseTokenHash = linkedPurchaseToken ? await sha256Hex(linkedPurchaseToken) : null
  const purchasedAt = getString(subscription, 'startTime') || null

  let entitlementStatus: EntitlementStatus
  let verificationStatus: VerificationStatus

  switch (googleState) {
    case 'SUBSCRIPTION_STATE_ACTIVE':
    case 'SUBSCRIPTION_STATE_CANCELED':
    case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
    case 'SUBSCRIPTION_STATE_EXPIRED':
      entitlementStatus = 'paid'
      verificationStatus = 'verified'
      break
    case 'SUBSCRIPTION_STATE_PENDING':
    case 'SUBSCRIPTION_STATE_ON_HOLD':
    case 'SUBSCRIPTION_STATE_PAUSED':
      entitlementStatus = 'pending'
      verificationStatus = 'pending'
      break
    case 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED':
      entitlementStatus = 'failed'
      verificationStatus = 'failed'
      break
    default:
      throw new HttpError(502, 'Google Play returned an unsupported subscription state. Please try Restore Purchase again shortly.')
  }

  if (entitlementStatus === 'paid' && !latestSuccessfulOrderId) {
    entitlementStatus = 'pending'
    verificationStatus = 'pending'
  }

  const purchase = await applyGooglePlayPurchase(serviceClient, authUserId, {
    productId: mapping.productId,
    purchaseToken,
    purchaseTokenHash,
    linkedPurchaseTokenHash,
    orderId,
    latestSuccessfulOrderId,
    googleState,
    entitlementStatus,
    acknowledged,
    consumed: false,
    purchasedAt,
    expiresAt,
  })

  const outcome = outcomeFromAppliedPurchase(
    verificationStatus,
    purchase,
    'Google Play subscription payment is pending, paused or on hold. The plan activates only after Google confirms an active paid period.',
    'Google Play could not confirm an active paid subscription for this purchase.',
  )

  if (verificationStatus === 'verified' && purchase) {
    try {
      if (!acknowledged) {
        await googlePlayRequest(
          config,
          accessToken,
          `/purchases/subscriptions/${encodeURIComponent(mapping.productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
          'POST',
        )
      }
      await markGooglePlayFinalized(
        serviceClient,
        authUserId,
        purchaseTokenHash,
        true,
        false,
        googleState,
      )
    } catch {
      // The purchase itself is verified and saved. A later restore/sync will
      // retry acknowledgement before Google's acknowledgement deadline.
      outcome.finalizationPending = true
    }
  }

  return outcome
}

const verifyOneTimeProduct = async (
  serviceClient: SupabaseClient,
  config: GooglePlayConfig,
  accessToken: string,
  authUserId: string,
  mapping: ProductMapping,
  purchaseToken: string,
): Promise<VerificationOutcome> => {
  const purchaseTokenHash = await sha256Hex(purchaseToken)
  const productPurchase = await googlePlayRequest(
    config,
    accessToken,
    `/purchases/products/${encodeURIComponent(mapping.productId)}/tokens/${encodeURIComponent(purchaseToken)}`,
  )

  const returnedProductId = normalizeProductId(productPurchase.productId)
  if (returnedProductId && returnedProductId !== mapping.productId) {
    throw new HttpError(400, 'This Google Play purchase token does not belong to the selected one-time product.')
  }

  const purchaseState = getNumber(productPurchase, 'purchaseState')
  const acknowledged = getNumber(productPurchase, 'acknowledgementState') === 1
  const consumed = getNumber(productPurchase, 'consumptionState') === 1
  const orderId = getString(productPurchase, 'orderId') || null
  const purchaseTimeMillis = getNumber(productPurchase, 'purchaseTimeMillis')
  const purchasedAt = purchaseTimeMillis ? new Date(purchaseTimeMillis).toISOString() : null

  let entitlementStatus: EntitlementStatus
  let verificationStatus: VerificationStatus
  let googleState: string

  if (purchaseState === 0) {
    entitlementStatus = 'paid'
    verificationStatus = 'verified'
    googleState = 'PURCHASED'
  } else if (purchaseState === 2) {
    entitlementStatus = 'pending'
    verificationStatus = 'pending'
    googleState = 'PENDING'
  } else if (purchaseState === 1) {
    entitlementStatus = 'failed'
    verificationStatus = 'failed'
    googleState = 'CANCELLED'
  } else {
    throw new HttpError(502, 'Google Play returned an unsupported one-time purchase state. Please try Restore Purchase again shortly.')
  }

  const purchase = await applyGooglePlayPurchase(serviceClient, authUserId, {
    productId: mapping.productId,
    purchaseToken,
    purchaseTokenHash,
    linkedPurchaseTokenHash: null,
    orderId,
    latestSuccessfulOrderId: orderId,
    googleState,
    entitlementStatus,
    acknowledged,
    consumed,
    purchasedAt,
    expiresAt: null,
  })

  const outcome = outcomeFromAppliedPurchase(
    verificationStatus,
    purchase,
    'Google Play payment is still pending. The plan activates only after Google confirms the payment.',
    'Google Play could not confirm this one-time purchase.',
  )

  if (verificationStatus === 'verified' && purchase && !consumed) {
    try {
      await googlePlayRequest(
        config,
        accessToken,
        `/purchases/products/${encodeURIComponent(mapping.productId)}/tokens/${encodeURIComponent(purchaseToken)}:consume`,
        'POST',
      )
      await markGooglePlayFinalized(
        serviceClient,
        authUserId,
        purchaseTokenHash,
        true,
        true,
        googleState,
      )
    } catch {
      // Entitlement was already verified and granted in the database. Restore
      // or server sync will retry consumption so the pass can be bought again.
      outcome.finalizationPending = true
    }
  } else if (verificationStatus === 'verified' && purchase && consumed) {
    try {
      await markGooglePlayFinalized(
        serviceClient,
        authUserId,
        purchaseTokenHash,
        true,
        true,
        googleState,
      )
    } catch {
      outcome.finalizationPending = true
    }
  }

  return outcome
}

const verifyAndApply = async (
  serviceClient: SupabaseClient,
  config: GooglePlayConfig,
  accessToken: string,
  authUserId: string,
  productId: string,
  purchaseToken: string,
): Promise<VerificationOutcome> => {
  const mapping = config.mappings.find(item => item.productId === productId)
  if (!mapping) {
    throw new HttpError(400, 'This Google Play product is not configured for PharmaSales Jobs.')
  }

  return mapping.productType === 'subscription'
    ? verifySubscription(serviceClient, config, accessToken, authUserId, mapping, purchaseToken)
    : verifyOneTimeProduct(serviceClient, config, accessToken, authUserId, mapping, purchaseToken)
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    if (request.method !== 'POST') {
      throw new HttpError(405, 'Use POST to verify a Google Play purchase.')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
    const supabaseAnonKey = getSupabaseEnvKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = getSupabaseEnvKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new HttpError(503, 'Supabase server configuration is missing for Google Play verification.')
    }

    const authorization = request.headers.get('Authorization') ?? ''
    if (!authorization.toLowerCase().startsWith('bearer ')) {
      throw new HttpError(401, 'Login as a Job Seeker before verifying a Google Play purchase.')
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: authorization } },
    })
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })

    const { data: userData, error: userError } = await userClient.auth.getUser()
    const user = userData?.user
    if (userError || !user) {
      throw new HttpError(401, 'Your Job Seeker login session has expired. Login again and retry the purchase.')
    }

    const { data: profiles, error: profilesError } = await userClient.rpc('list_auth_profiles_for_current_user')
    if (profilesError) {
      throw new HttpError(500, 'Your Job Seeker account could not be checked before purchase verification.')
    }
    const hasSeekerProfile = asArray(profiles).some(profile => getString(asRecord(profile), 'role') === 'seeker')
    if (!hasSeekerProfile) {
      throw new HttpError(403, 'Google Play plans can be linked only to a Job Seeker account.')
    }

    const body = asRecord(await request.json().catch(() => ({})) as unknown)
    const action = getString(body, 'action').toLowerCase() || 'verify'
    const config = await loadGooglePlayConfig(serviceClient)
    const accessToken = await getGoogleAccessToken(config)

    if (action === 'verify') {
      const productId = normalizeProductId(body.productId)
      const purchaseToken = typeof body.purchaseToken === 'string' ? body.purchaseToken.trim() : ''

      if (!productId || purchaseToken.length < 10 || purchaseToken.length > 10000) {
        throw new HttpError(400, 'Google Play did not return a valid product ID and purchase token.')
      }

      const outcome = await verifyAndApply(
        serviceClient,
        config,
        accessToken,
        user.id,
        productId,
        purchaseToken,
      )

      return jsonResponse({
        ok: outcome.status === 'verified',
        status: outcome.status,
        purchase: outcome.purchase ?? null,
        message: outcome.message,
        finalizationPending: outcome.finalizationPending === true,
      })
    }

    if (action === 'sync') {
      const { data: storedPurchases, error: storedPurchasesError } = await serviceClient
        .from('app_google_play_purchases')
        .select('product_id, product_type, purchase_token, purchase_token_hash')
        .eq('auth_user_id', user.id)
        .or('product_type.eq.subscription,consumed.eq.false')
        .order('updated_at', { ascending: false })
        .limit(50)

      if (storedPurchasesError) {
        throw new HttpError(503, 'The Google Play billing database update is not applied yet.')
      }

      const purchases: RemotePurchaseRow[] = []
      let failed = 0

      for (const storedValue of asArray(storedPurchases)) {
        const stored = asRecord(storedValue) as Partial<StoredGooglePlayPurchase>
        const productId = normalizeProductId(stored.product_id)
        const purchaseToken = typeof stored.purchase_token === 'string' ? stored.purchase_token : ''
        if (!productId || !purchaseToken) {
          failed += 1
          continue
        }

        try {
          const outcome = await verifyAndApply(
            serviceClient,
            config,
            accessToken,
            user.id,
            productId,
            purchaseToken,
          )
          if (outcome.purchase) purchases.push(outcome.purchase)
        } catch {
          failed += 1
        }
      }

      return jsonResponse({
        ok: true,
        status: 'synced',
        purchases,
        synced: purchases.length,
        failed,
      })
    }

    throw new HttpError(400, 'Unknown Google Play verification action.')
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ ok: false, status: 'error', message: error.message }, error.status)
    }

    console.error('verify-google-play-purchase failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonResponse({
      ok: false,
      status: 'error',
      message: 'Google Play purchase verification failed on the server. The plan was not activated.',
    }, 500)
  }
})
