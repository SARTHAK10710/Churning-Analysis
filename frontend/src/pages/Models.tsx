import { useEffect, useState } from 'react'
import { CheckCircle2, Star } from 'lucide-react'
import { api, type Metrics } from '../lib/api'
import { num, pct } from '../lib/format'
import { Callout, Card, CardHeader, Kpi, PageHeader, PageSkeleton, Tag, cx } from '../components/ui'
import { Legend } from '../components/charts'

export default function Models() {
  const [data, setData] = useState<Metrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.metrics().then(setData).catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <Callout title="Could not load model metrics" tone="error">{error}</Callout>
  if (!data) return <PageSkeleton />

  const deployed = data.models.find((m) => m.deployed)!
  const baseline = data.models.find((m) => m.key === 'baseline')!
  const best = (k: 'accuracy' | 'recall' | 'precision' | 'roc_auc') => Math.max(...data.models.map((m) => m[k]))
  const maxPrecisionKey = data.models.reduce((a, b) => (b.precision > a.precision ? b : a)).key
  const { tn, fp, fn, tp } = data.confusion_matrix
  const total = tn + fp + fn + tp
  const actualLeavers = fn + tp
  const maxImportance = data.feature_importance[0]?.importance ?? 1
  const top3 = data.feature_importance.slice(0, 3).reduce((s, f) => s + f.importance, 0)

  return (
    <>
      <PageHeader
        eyebrow={`Hold-out evaluation · v${data.version}`}
        title="Model Performance & Evaluation"
        description={`Every model was trained on the same ${num(data.split.train)} customers and tested on the same ${num(
          data.split.test,
        )} customers it never saw (80/20 split, random_state=${data.split.random_state}).`}
        right={<Tag tone="brand">Threshold {data.threshold.toFixed(2)}</Tag>}
      />

      <Callout title="Why recall is the metric that matters">
        About {pct(1 - data.split.test_churn_rate, 0)} of customers stay, so a model that always predicts “stays” scores{' '}
        <strong>{pct(baseline.accuracy)} accuracy</strong> while catching <strong className="text-rose-600 dark:text-rose-400">0% of leavers</strong>.{' '}
        <strong className="text-brand-text">Recall</strong> measures how many of the customers who actually left the model caught in time.
      </Callout>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Accuracy"
          value={pct(deployed.accuracy)}
          note={`+${((deployed.accuracy - baseline.accuracy) * 100).toFixed(1)} pts over always guessing “stay”`}
          badge={<Tag tone="good">Best</Tag>}
          bar={deployed.accuracy}
        />
        <Kpi
          label="Recall (leavers caught)"
          value={pct(deployed.recall)}
          valueClass="text-brand-text"
          note={`${num(tp)} of ${num(actualLeavers)} customers who left were flagged`}
          badge={deployed.recall === best('recall') ? <Tag tone="brand">Rank #1</Tag> : undefined}
          bar={deployed.recall}
        />
        <Kpi
          label="Precision"
          value={pct(deployed.precision)}
          note={`${num(tp)} of ${num(tp + fp)} flagged customers really left`}
          bar={deployed.precision}
          barClass="bg-ink"
        />
        <Kpi
          label="ROC-AUC"
          value={deployed.roc_auc.toFixed(3)}
          note="Ranking quality across all thresholds (0.5 = random)"
          badge={<Tag tone="good">Strong</Tag>}
          bar={deployed.roc_auc}
          barClass="bg-emerald-600"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <Card className="overflow-hidden p-0 xl:col-span-7">
          <div className="p-5 pb-0">
            <CardHeader
              title="Model benchmark comparison"
              subtitle={`Same ${num(data.split.test)}-customer hold-out set for every model · best value per column in bold`}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="border-y border-line bg-canvas">
                <tr className="text-caps uppercase text-muted">
                  <th className="px-5 py-3">Model</th>
                  <th className="px-3 py-3 text-right">Accuracy</th>
                  <th className="px-3 py-3 text-right">Recall</th>
                  <th className="px-3 py-3 text-right">Precision</th>
                  <th className="px-3 py-3 text-right">ROC-AUC</th>
                  <th className="px-5 py-3 text-right">Tag</th>
                </tr>
              </thead>
              <tbody>
                {data.models.map((m) => {
                  const cell = (k: 'accuracy' | 'recall' | 'precision' | 'roc_auc', fmt: (v: number) => string) => (
                    <td
                      className={cx(
                        'tnum px-3 text-right',
                        m[k] === best(k) ? 'font-semibold text-ink' : 'text-body',
                        k === 'recall' && m[k] === 0 && 'text-rose-600 dark:text-rose-400',
                      )}
                    >
                      {fmt(m[k])}
                    </td>
                  )
                  return (
                    <tr key={m.key} className={cx('h-12 border-b border-subtle', m.deployed && 'bg-brand-soft/50')} title={m.description}>
                      <td className="px-5">
                        <span className={cx('flex items-center gap-2', m.deployed ? 'font-semibold text-brand-text' : 'text-ink')}>
                          {m.deployed && <CheckCircle2 size={16} />}
                          {m.name}
                        </span>
                      </td>
                      {cell('accuracy', (v) => pct(v))}
                      {cell('recall', (v) => pct(v))}
                      {cell('precision', (v) => pct(v))}
                      {cell('roc_auc', (v) => v.toFixed(3))}
                      <td className="px-5 text-right">
                        {m.deployed ? (
                          <span className="whitespace-nowrap rounded-full bg-emerald-500 px-2.5 py-1 text-caps text-white">Deployed</span>
                        ) : m.key === 'baseline' ? (
                          <Tag tone="brand">Baseline</Tag>
                        ) : m.key === maxPrecisionKey ? (
                          <Tag tone="brand">Max precision</Tag>
                        ) : (
                          <span className="text-body-sm text-muted">Evaluated</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-3 text-body-sm text-muted">
            Evaluated at a probability threshold of {data.threshold.toFixed(2)}. Hover a row for a description of the model.
          </p>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader
            title="Accuracy vs. recall gap"
            subtitle="High accuracy can hide a model that misses most leavers"
            right={
              <Legend
                items={[
                  { label: 'Accuracy', className: 'bg-line-strong' },
                  { label: 'Recall', className: 'bg-brand' },
                ]}
              />
            }
          />
          <div className="flex flex-col gap-3">
            {data.models.map((m) => (
              <div key={m.key} className={cx('rounded-lg p-2', m.deployed && 'bg-brand-soft/50 ring-1 ring-brand/20')}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-body-sm">
                  <span className={cx('flex items-center gap-1', m.deployed ? 'font-semibold text-brand-text' : 'text-body')}>
                    {m.deployed && <Star size={12} fill="currentColor" />}
                    {m.name}
                  </span>
                  <span className="tnum text-muted">
                    {pct(m.accuracy)} / <span className="text-brand-text">{pct(m.recall)}</span>
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 rounded-full bg-subtle">
                    <div className="h-full rounded-full bg-line-strong" style={{ width: `${m.accuracy * 100}%` }} />
                  </div>
                  <div className="h-1.5 rounded-full bg-subtle">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${m.recall * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Confusion matrix (deployed model)"
            subtitle={`${num(total)} hold-out customers`}
            right={<Tag>Threshold {data.threshold.toFixed(2)}</Tag>}
          />
          <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
            <span />
            <span className="label-caps text-center">Predicted stay</span>
            <span className="label-caps text-center">Predicted leave</span>
            <span className="label-caps flex items-center [writing-mode:vertical-rl] rotate-180">Actually stayed</span>
            <Cell title="True negative" value={tn} total={total} note="Correctly left alone" tone="neutral" />
            <Cell title="False positive" value={fp} total={total} note="False alarms" tone="brand-soft" />
            <span className="label-caps flex items-center [writing-mode:vertical-rl] rotate-180">Actually left</span>
            <Cell title="False negative" value={fn} total={total} note="Missed leavers" tone="bad" />
            <Cell title="True positive" value={tp} total={total} note="Caught in time" tone="brand" />
          </div>
          <div className="mt-4 space-y-1 text-body-sm text-muted">
            <p>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-brand" />
              Customers who actually left: <strong className="text-ink">{num(actualLeavers)}</strong> ({num(fn)} missed + {num(tp)} caught)
            </p>
            <p>
              Recall = {num(tp)} / ({num(tp)} + {num(fn)}) = <strong className="text-brand-text">{pct(deployed.recall)}</strong>
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Feature importance"
            subtitle="Share of the Gradient Boosting model's split gain"
            right={<Tag>{data.feature_importance.length} features</Tag>}
          />
          <div className="flex flex-col gap-2.5">
            {data.feature_importance.map((f, i) => (
              <div key={f.feature} className="grid grid-cols-[1.25rem_8.5rem_1fr_3rem] items-center gap-2 text-body-sm">
                <span className="tnum text-muted">{i + 1}.</span>
                <span className={cx('truncate', i < 3 ? 'font-semibold text-ink' : 'text-body')}>{f.label}</span>
                <div className="h-2 rounded-full bg-subtle">
                  <div
                    className={cx('h-full rounded-full', i < 3 ? 'bg-brand' : i < 5 ? 'bg-brand/60' : 'bg-faint/60')}
                    style={{ width: `${(f.importance / maxImportance) * 100}%` }}
                  />
                </div>
                <span className="tnum text-right text-body">{pct(f.importance)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-body-sm text-muted">
            The top 3 features account for <strong className="text-ink">{pct(top3, 0)}</strong> of the model's decisions.
          </p>
        </Card>
      </div>

      <p className="mt-6 text-body-sm text-faint">
        Trained {new Date(data.trained_at).toLocaleString()} · scikit-learn {data.sklearn_version} · reproduce with{' '}
        <code className="font-mono">python -m churn.train</code>
      </p>
    </>
  )
}

function Cell({
  title,
  value,
  total,
  note,
  tone,
}: {
  title: string
  value: number
  total: number
  note: string
  tone: 'neutral' | 'brand-soft' | 'bad' | 'brand'
}) {
  const tones = {
    neutral: 'bg-subtle',
    'brand-soft': 'bg-brand-soft/60',
    bad: 'bg-rose-600/[0.08]',
    brand: 'bg-brand-soft',
  }
  return (
    <div className={cx('rounded-xl p-4', tones[tone])}>
      <p className={cx('text-caps uppercase', tone === 'bad' ? 'text-rose-700 dark:text-rose-400' : tone === 'brand' ? 'text-brand-text' : 'text-muted')}>
        {title}
      </p>
      <p className={cx('tnum mt-1 text-metric', tone === 'bad' ? 'text-rose-600 dark:text-rose-400' : tone === 'brand' ? 'text-brand-text' : 'text-ink')}>
        {num(value)}
      </p>
      <p className="text-body-sm text-muted">
        {pct(value / total)} · {note}
      </p>
    </div>
  )
}
