export type Risk = 'low' | 'medium' | 'high'

export interface CustomerInput {
  CreditScore: number
  Geography: 'France' | 'Germany' | 'Spain'
  Gender: 'Female' | 'Male'
  Age: number
  Tenure: number
  Balance: number
  NumOfProducts: number
  HasCrCard: 0 | 1
  IsActiveMember: 0 | 1
  EstimatedSalary: number
}

export interface Factor {
  feature: string
  label: string
  note: string
  impact: number
}

export interface Action {
  feature: string | null
  title: string
  detail: string
  cta: string
}

export interface Prediction {
  probability: number
  risk: Risk
  will_churn: boolean
  threshold: number
  baseline_rate: number
  relative_risk: number
  base_value: number
  total_impact: number
  factors: Factor[]
  actions: Action[]
  latency_ms: number
}

export interface Health {
  status: string
  model: string
  version: string
  trained_at: string
  n_train: number
  n_customers: number
}

export interface ModelMetrics {
  key: string
  name: string
  description: string
  deployed: boolean
  accuracy: number
  precision: number
  recall: number
  f1: number
  roc_auc: number
}

export interface Metrics {
  version: string
  trained_at: string
  sklearn_version: string
  deployed: string
  threshold: number
  split: { train: number; test: number; test_size: number; random_state: number; test_churn_rate: number }
  models: ModelMetrics[]
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number }
  feature_importance: { feature: string; label: string; importance: number }[]
}

export interface RateRow {
  label: string
  rate: number
  churned: number
  count: number
}

export interface Insights {
  filters: { geography: string; gender: string }
  total: number
  churned: number
  retained: number
  churn_rate: number
  by_country: RateRow[]
  by_gender: RateRow[]
  by_age: RateRow[]
  by_products: RateRow[]
  by_activity: RateRow[]
  correlations: { feature: string; value: number }[]
}

export interface ScoredRow extends CustomerInput {
  CustomerId: string
  Surname: string
  ChurnProbability: number
  RiskLevel: Risk
}

export interface BatchResult {
  filename: string
  size_bytes: number
  rows: ScoredRow[]
  summary: {
    total: number
    high: number
    medium: number
    low: number
    mean_probability: number
    median_probability: number
  }
  baseline_rate: number
  processing_ms: number
}

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const apiUrl = (path: string) => `${BASE}/api${path}`

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(apiUrl(path), init)
  } catch {
    throw new Error('Cannot reach the ChurnLens API. Is the backend running on port 8000?')
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') message = body.detail
      else if (Array.isArray(body.detail)) message = body.detail.map((d: { msg: string }) => d.msg).join('; ')
    } catch {
      /* keep the generic message */
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => request<Health>('/health'),
  metrics: () => request<Metrics>('/metrics'),
  insights: (geography: string, gender: string) =>
    request<Insights>(`/insights?${new URLSearchParams({ geography, gender })}`),
  predict: (customer: CustomerInput) =>
    request<Prediction>('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    }),
  predictBatch: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<BatchResult>('/predict/batch', { method: 'POST', body: form })
  },
  sampleCsvUrl: apiUrl('/sample-csv'),
}
