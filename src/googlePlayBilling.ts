export const GOOGLE_PLAY_BILLING_METHOD = 'https://play.google.com/billing'

export type GooglePlayProductType = 'subscription' | 'one-time'

export type GooglePlayItemDetails = {
  itemId: string
  title: string
  description?: string
  type?: 'product' | 'subscription' | string
  price: {
    currency: string
    value: string
  }
  subscriptionPeriod?: string
  freeTrialPeriod?: string
  introductoryPrice?: {
    currency: string
    value: string
  }
  introductoryPricePeriod?: string
  introductoryPriceCycles?: number
  iconURLs?: string[]
}

export type GooglePlayPurchaseDetails = {
  itemId: string
  purchaseToken: string
}

type DigitalGoodsServiceLike = {
  getDetails: (itemIds: string[]) => Promise<GooglePlayItemDetails[]>
  listPurchases: () => Promise<GooglePlayPurchaseDetails[]>
  listPurchaseHistory?: () => Promise<GooglePlayPurchaseDetails[]>
  consume?: (purchaseToken: string) => Promise<void>
}

type DigitalGoodsWindow = Window & typeof globalThis & {
  getDigitalGoodsService?: (serviceProvider: string) => Promise<DigitalGoodsServiceLike>
}

export class GooglePlayBillingError extends Error {
  readonly code: 'unsupported' | 'cancelled' | 'invalid-response' | 'unavailable'

  constructor(code: GooglePlayBillingError['code'], message: string) {
    super(message)
    this.name = 'GooglePlayBillingError'
    this.code = code
  }
}

const getBillingWindow = (): DigitalGoodsWindow | null => (
  typeof window === 'undefined' ? null : window as DigitalGoodsWindow
)

export const getGooglePlayService = async (): Promise<DigitalGoodsServiceLike | null> => {
  const billingWindow = getBillingWindow()
  if (!billingWindow?.getDigitalGoodsService || typeof billingWindow.PaymentRequest !== 'function') {
    return null
  }

  try {
    return await billingWindow.getDigitalGoodsService(GOOGLE_PLAY_BILLING_METHOD)
  } catch {
    return null
  }
}

export const loadGooglePlayCatalog = async (
  productIds: string[],
): Promise<{ supported: boolean; detailsById: Record<string, GooglePlayItemDetails> }> => {
  const service = await getGooglePlayService()
  if (!service) return { supported: false, detailsById: {} }

  const uniqueProductIds = Array.from(new Set(productIds.map(id => id.trim()).filter(Boolean)))
  if (uniqueProductIds.length === 0) return { supported: true, detailsById: {} }

  try {
    const details = await service.getDetails(uniqueProductIds)
    return {
      supported: true,
      detailsById: Object.fromEntries(details.map(detail => [detail.itemId, detail])),
    }
  } catch {
    // The Digital Goods service exists, but Play could not return these
    // products (for example, the Play Console products are not active yet).
    return { supported: true, detailsById: {} }
  }
}

export const listGooglePlayPurchases = async (): Promise<GooglePlayPurchaseDetails[]> => {
  const service = await getGooglePlayService()
  if (!service) return []
  const purchases = await service.listPurchases()
  return purchases.filter(purchase => purchase?.itemId && purchase?.purchaseToken)
}

export const formatGooglePlayPrice = (detail?: GooglePlayItemDetails | null): string => {
  if (!detail?.price?.currency || detail.price.value === undefined) return ''
  const value = Number(detail.price.value)
  if (!Number.isFinite(value)) return ''
  try {
    return new Intl.NumberFormat(navigator.language || 'en-IN', {
      style: 'currency',
      currency: detail.price.currency,
    }).format(value)
  } catch {
    return `${detail.price.currency} ${detail.price.value}`
  }
}

const getPurchaseTokenFromPaymentResponse = (response: PaymentResponse): string => {
  const details = (response.details ?? {}) as Record<string, unknown>
  const token = details.purchaseToken ?? details.token
  return typeof token === 'string' ? token.trim() : ''
}

export async function buyGooglePlayProduct<T>(
  productId: string,
  verifyPurchase: (purchaseToken: string) => Promise<T>,
): Promise<T> {
  const billingWindow = getBillingWindow()
  if (!billingWindow?.getDigitalGoodsService || typeof billingWindow.PaymentRequest !== 'function') {
    throw new GooglePlayBillingError(
      'unsupported',
      'Google Play Billing is available only inside the Android app installed from Google Play.',
    )
  }

  const service = await getGooglePlayService()
  if (!service) {
    throw new GooglePlayBillingError(
      'unsupported',
      'Google Play Billing is available only inside the Android app installed from Google Play.',
    )
  }

  let request: PaymentRequest
  try {
    request = new billingWindow.PaymentRequest(
      [{
        supportedMethods: GOOGLE_PLAY_BILLING_METHOD,
        data: { sku: productId },
      }],
      {
        // Required by Payment Request. Google Play ignores this amount and
        // charges the localized price configured in Play Console.
        total: {
          label: 'Total',
          amount: { currency: 'INR', value: '0' },
        },
      },
    )
  } catch {
    throw new GooglePlayBillingError('unavailable', 'Google Play Billing could not be opened on this device.')
  }

  let response: PaymentResponse
  try {
    response = await request.show()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new GooglePlayBillingError('cancelled', 'Google Play purchase was cancelled. No plan was activated.')
    }
    throw new GooglePlayBillingError(
      'unavailable',
      'Google Play could not complete this purchase. Please check that the product is active for this test/release track.',
    )
  }

  const purchaseToken = getPurchaseTokenFromPaymentResponse(response)
  if (!purchaseToken) {
    await response.complete('fail').catch(() => undefined)
    throw new GooglePlayBillingError(
      'invalid-response',
      'Google Play did not return a purchase token, so the plan was not activated.',
    )
  }

  try {
    const verifiedPurchase = await verifyPurchase(purchaseToken)
    await response.complete('success').catch(() => undefined)
    return verifiedPurchase
  } catch (error) {
    await response.complete('fail').catch(() => undefined)
    throw error
  }
}
