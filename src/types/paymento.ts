export interface PaymentoCreateInput {
  amount: number | string
  currency: string
  orderId: string
  returnUrl?: string
  speed?: 0 | 1
  email?: string
  description?: string
  additionalData?: Array<{ key: string; value: string }>
}

export interface PaymentoCreateResult {
  token: string
  paymentUrl: string
}

export interface PaymentoVerifyResult {
  status: number
  orderId: string
  amount: number
  currency: string
  raw: any
}

// Paymento order lifecycle statuses (per Paymento callback docs).
// Note: 6 is intentionally unused by the gateway.
export enum PaymentoOrderStatus {
  Initialize = 0,
  Pending = 1,
  PartialPaid = 2,
  WaitingToConfirm = 3,
  Timeout = 4,
  UserCanceled = 5,
  Paid = 7,
  Approve = 8,
  Reject = 9,
}

export function isPaymentSuccessful(status: number): boolean {
  return status === PaymentoOrderStatus.Paid || status === PaymentoOrderStatus.Approve
}

export function isPaymentFailed(status: number): boolean {
  return (
    status === PaymentoOrderStatus.Timeout ||
    status === PaymentoOrderStatus.UserCanceled ||
    status === PaymentoOrderStatus.Reject
  )
}

export function isPaymentPending(status: number): boolean {
  return !isPaymentSuccessful(status) && !isPaymentFailed(status)
}

export function paymentStatusLabel(status: number): string {
  switch (status) {
    case PaymentoOrderStatus.Initialize:
      return 'Initialized'
    case PaymentoOrderStatus.Pending:
      return 'Pending'
    case PaymentoOrderStatus.PartialPaid:
      return 'Partially paid'
    case PaymentoOrderStatus.WaitingToConfirm:
      return 'Waiting for confirmations'
    case PaymentoOrderStatus.Timeout:
      return 'Expired'
    case PaymentoOrderStatus.UserCanceled:
      return 'Cancelled'
    case PaymentoOrderStatus.Paid:
      return 'Paid'
    case PaymentoOrderStatus.Approve:
      return 'Confirmed'
    case PaymentoOrderStatus.Reject:
      return 'Rejected'
    default:
      return 'Unknown'
  }
}
