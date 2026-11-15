import { useEffect, useState, type ReactNode } from 'react'
import { Activity, Lightbulb, UserRoundX, Users, UsersRound, ShieldCheck } from 'lucide-react'
import { api, type Insights as Data, type RateRow } from '../lib/api'
import { num, pct } from '../lib/format'
import { Callout, Card, CardHeader, Kpi, PageHeader, PageSkeleton, Segmented, Tag, cx } from '../components/ui'
import { BarRow, DivergingBar, Donut } from '../components/charts'

const CORR_LABELS: Record<string, string> = {
  Age: 'Age',
  Balance: 'Balance',
  IsActiveMember: 'Active member',
  NumOfProducts: 'Number of products',
  CreditScore: 'Credit score',
  Tenure: 'Tenure',
  EstimatedSalary: 'Estimated salary',
  HasCrCard: 'Has credit card',
}

const present = (rows: RateRow[]) => rows.filter((r) => r.count > 0)
const top = (rows: RateRow[]) => present(rows).reduce((a, b) => (b.rate > a.rate ? b : a), present(rows)[0])

function takeaways(d: Data) {
  const items: { title: string; body: string }[] = []
  const countries = present(d.by_country)
  if (countries.length > 1) {
    const worst = top(countries)
    const others = countries.filter((c) => c !== worst)
    const otherRate = others.reduce((s, c) => s + c.churned, 0) / Math.max(1, others.reduce((s, c) => s + c.count, 0))
    items.push({
      title: `${worst.label} needs localised retention`,
      body: `Customers in ${worst.label} churn at ${pct(worst.rate)}, ${(worst.rate / otherRate).toFixed(1)}× the rest (${pct(otherRate)}). Review fees and product fit there first.`,
    })
  }
  const peak = top(d.by_age)
  const youngest = present(d.by_age)[0]
  if (peak && youngest && peak !== youngest) {
    items.push({
      title: `Target the ${peak.label} age group`,
      body: `Churn peaks at ${pct(peak.rate)} for ages ${peak.label}, ${(peak.rate / Math.max(youngest.rate, 0.001)).toFixed(1)}× the ${youngest.label} group. Offer dedicated advisers before they leave.`,
    })
  }
  const solid = present(d.by_products).filter((p) => p.count >= 50)
  if (solid.length) {
    const sweet = solid.reduce((a, b) => (b.rate < a.rate ? b : a))
    items.push({
      title: `${sweet.label} products is the sweet spot`,
      body: `Customers holding ${sweet.label} products churn only ${pct(sweet.rate)}. Cross-sell single-product customers a second product; review 3+ product bundles for friction.`,
    })
  }
  const [inactive, active] = d.by_activity
  if (inactive?.count && active?.count) {
    items.push({
      title: 'Active membership drives retention',
      body: `Engagement cuts churn from ${pct(inactive.rate)} to ${pct(active.rate)}. Re-engagement campaigns for inactive members are the cheapest lever.`,
    })
  }
  return items
}

export default function Insights() {
  const [geography, setGeography] = useState('All')
  const [gender, setGender] = useState('All')
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .insights(geography, gender)
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [geography, gender])

  if (error && !data) return <Callout title="Could not load insights" tone="error">{error}</Callout>
  if (!data) return <PageSkeleton />

  const countryMax = Math.max(...data.by_country.map((c) => c.rate), 0.01)
  const worstCountry = top(data.by_country)
  const ageMax = Math.max(...data.by_age.map((a) => a.rate), 0.01)
  const peakAge = top(data.by_age)
  const productMax = Math.max(...data.by_products.map((p) => p.rate), 0.01)
  const corrMax = Math.max(...data.correlations.map((c) => Math.abs(c.value)), 0.01)
  const [female, male] = data.by_gender
  const [inactive, active] = data.by_activity
  const filtered = geography !== 'All' || gender !== 'All'

  return (
    <>
      <PageHeader
        eyebrow="Exploratory analysis"
        title="Data Insights"
        description="Churn patterns across the 10,000 bank customers in Churn_Modelling.csv. Use the filters to focus on a segment."
        right={
          <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-body-sm text-muted ring-1 ring-line">
            <ShieldCheck size={14} className="text-emerald-600" /> Dataset: <code className="font-mono text-brand-text">Churn_Modelling.csv</code>
          </span>
        }
      />

      <div className="card mb-6 flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <span className="label-caps px-1">Filter cohort</span>
        <Segmented
          label="Country filter"
          className="md:w-[22rem]"
          value={geography}
          onChange={setGeography}
          options={['All', 'France', 'Germany', 'Spain'].map((v) => ({ value: v, label: v === 'All' ? 'All countries' : v }))}
        />
        <Segmented
          label="Gender filter"
          className="md:w-[16rem]"
          value={gender}
          onChange={setGender}
          options={['All', 'Female', 'Male'].map((v) => ({ value: v, label: v === 'All' ? 'All genders' : v }))}
        />
        {filtered && (
          <button
            type="button"
            className="btn-ghost md:ml-auto"
            onClick={() => {
              setGeography('All')
              setGender('All')
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className={cx('transition-opacity', loading && 'opacity-60')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Total customers" value={num(data.total)} suffix={filtered ? 'in segment' : '100% sample'} bar={data.total / 10000} badge={<Users size={16} className="text-brand-text" />} />
          <Kpi
            label="Churn rate"
            value={pct(data.churn_rate)}
            valueClass="text-rose-600 dark:text-rose-400"
            suffix={`about 1 in ${Math.round(1 / Math.max(data.churn_rate, 0.001))}`}
            bar={data.churn_rate}
            barClass="bg-rose-600"
          />
          <Kpi label="Churned" value={num(data.churned)} suffix="departed" bar={data.churned / Math.max(data.total, 1)} barClass="bg-rose-600" badge={<UserRoundX size={16} className="text-rose-600" />} />
          <Kpi
            label="Retained"
            value={num(data.retained)}
            suffix={`${pct(data.retained / Math.max(data.total, 1))} of base`}
            bar={data.retained / Math.max(data.total, 1)}
            barClass="bg-emerald-600"
            badge={<ShieldCheck size={16} className="text-emerald-600" />}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-5">
            <CardHeader title="Churn composition" subtitle="Share of customers who stayed vs. left" right={<Tag>N = {num(data.total)}</Tag>} />
            <Donut value={data.churn_rate}>
              <span className="label-caps">Churn rate</span>
              <span className="tnum text-head-lg text-rose-600 dark:text-rose-400">{pct(data.churn_rate)}</span>
              <span className="text-body-sm text-muted">{num(data.churned)} departed</span>
            </Donut>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-brand-soft/60 p-3">
                <p className="flex items-center gap-1.5 text-body-sm font-medium text-ink">
                  <span className="h-2 w-2 rounded-full bg-indigo-300" /> Retained
                </p>
                <p className="tnum text-head-md text-ink">{num(data.retained)}</p>
                <p className="text-body-sm text-muted">{pct(1 - data.churn_rate)} of base</p>
              </div>
              <div className="rounded-lg bg-rose-600/[0.06] p-3">
                <p className="flex items-center gap-1.5 text-body-sm font-medium text-rose-700 dark:text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-600" /> Churned
                </p>
                <p className="tnum text-head-md text-rose-600 dark:text-rose-400">{num(data.churned)}</p>
                <p className="text-body-sm text-muted">{pct(data.churn_rate)} lost</p>
              </div>
            </div>
          </Card>

          <Card className="xl:col-span-7">
            <CardHeader
              title="Churn rate by country"
              subtitle={
                present(data.by_country).length > 1
                  ? `${worstCountry?.label} has the highest churn of the three markets`
                  : `Showing ${geography} only. Clear the country filter to compare markets`
              }
              tag={worstCountry && present(data.by_country).length > 1 ? <Tag tone="bad">{worstCountry.label}: highest</Tag> : undefined}
            />
            <div className="flex flex-col gap-5">
              {data.by_country.map((c) => (
                <div key={c.label}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-body-md font-medium text-ink">{c.label}</span>
                    <span className="text-body-sm text-muted">
                      <strong className={cx('tnum text-head-md', c === worstCountry ? 'text-rose-600 dark:text-rose-400' : 'text-ink')}>
                        {c.count ? pct(c.rate) : '—'}
                      </strong>{' '}
                      ({num(c.churned)} of {num(c.count)})
                    </span>
                  </div>
                  <div className="h-5 rounded-md bg-subtle">
                    <div
                      className={cx('h-full rounded-md transition-all duration-500', c === worstCountry ? 'bg-rose-600' : 'bg-indigo-300 dark:bg-indigo-400/60')}
                      style={{ width: `${(c.rate / countryMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader title="Churn rate by age group" subtitle="Risk climbs steeply through middle age" tag={<Tag tone="bad">Peak {peakAge?.label}</Tag>} />
            <div className="flex flex-col gap-3.5">
              {data.by_age.map((a) => (
                <BarRow
                  key={a.label}
                  label={a.label}
                  sub={`${num(a.count)} customers`}
                  value={a.rate}
                  max={ageMax}
                  display={a.count ? pct(a.rate) : '—'}
                  highlight={a === peakAge}
                  barClass={a === peakAge ? 'bg-rose-600' : a.rate > 0.25 ? 'bg-rose-400' : 'bg-indigo-300 dark:bg-indigo-400/60'}
                />
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Churn rate by number of products" subtitle="Two products is the most loyal group" tag={<Tag tone="good">2 = optimal</Tag>} />
            <div className="grid h-52 grid-cols-4 items-end gap-3">
              {data.by_products.map((p) => {
                const low = p.label === '2'
                return (
                  <div key={p.label} className="flex h-full flex-col items-center justify-end gap-1.5">
                    <span className={cx('tnum text-body-md font-semibold', low ? 'text-emerald-600 dark:text-emerald-400' : p.rate > 0.5 ? 'text-rose-600 dark:text-rose-400' : 'text-ink')}>
                      {p.count ? pct(p.rate) : '—'}
                    </span>
                    <div className="flex w-full flex-1 items-end rounded-t-lg bg-subtle">
                      <div
                        className={cx('w-full rounded-t-lg transition-all duration-500', low ? 'bg-emerald-500' : p.rate > 0.5 ? 'bg-rose-600' : 'bg-indigo-300 dark:bg-indigo-400/60')}
                        style={{ height: `${Math.max(2, (p.rate / productMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-3 text-center">
              {data.by_products.map((p) => (
                <div key={p.label}>
                  <p className="text-body-md font-medium text-ink">
                    {p.label} product{p.label === '1' ? '' : 's'}
                  </p>
                  <p className="tnum text-body-sm text-muted">{num(p.count)} cust.</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-body-sm italic text-muted">
              Note: 3–4 products is a small group ({num((data.by_products[2]?.count ?? 0) + (data.by_products[3]?.count ?? 0))} customers), so treat those rates with care.
            </p>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <CompareCard
            icon={<UsersRound size={18} />}
            title="Gender"
            subtitle="Churn rate by gender"
            a={{ label: 'Female', row: female }}
            b={{ label: 'Male', row: male }}
          />
          <CompareCard
            icon={<Activity size={18} />}
            title="Member activity"
            subtitle="Active vs. inactive members"
            a={{ label: 'Inactive member', row: inactive }}
            b={{ label: 'Active member', row: active }}
            goodSide="b"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-7">
            <CardHeader title="Correlation with churn" subtitle="Pearson coefficient: right = more churn, left = less churn" />
            <div className="mb-2 grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
              <span className="col-span-4">Feature</span>
              <span className="col-span-8 grid grid-cols-2">
                <span className="pr-2 text-right">Protective (−)</span>
                <span className="pl-2">Risk factor (+)</span>
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {data.correlations.map((c) => (
                <div key={c.feature} className="grid grid-cols-12 items-center gap-2">
                  <span className="col-span-4 truncate text-body-md text-ink">{CORR_LABELS[c.feature] ?? c.feature}</span>
                  <div className="col-span-8">
                    <DivergingBar value={c.value} max={corrMax} display={`${c.value >= 0 ? '+' : '−'}${Math.abs(c.value).toFixed(2)}`} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-subtle/70 p-3 text-body-sm text-body">
              Correlation only captures straight-line relationships. Number of products looks weak here (−0.05) but is the model's
              2nd most important feature, because its effect is U-shaped: 2 products is safe, 3–4 is very risky.
            </p>
          </Card>

          <Card className="xl:col-span-5">
            <CardHeader title="Key takeaways" subtitle={filtered ? 'Computed for the filtered segment' : 'Computed from the full dataset'} tag={<Lightbulb size={16} className="text-brand-text" />} />
            <ol className="flex flex-col gap-3">
              {takeaways(data).map((t, i) => (
                <li key={t.title} className="flex gap-3 rounded-lg bg-subtle p-3">
                  <span
                    className={cx(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-body-sm font-semibold',
                      ['bg-rose-600/10 text-rose-700 dark:text-rose-400', 'bg-rose-600/10 text-rose-700 dark:text-rose-400', 'bg-brand-soft text-brand-text', 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'][i],
                    )}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-head-sm text-ink">{t.title}</p>
                    <p className="mt-0.5 text-body-sm text-muted">{t.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  )
}

function CompareCard({
  icon,
  title,
  subtitle,
  a,
  b,
  goodSide,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  a: { label: string; row?: RateRow }
  b: { label: string; row?: RateRow }
  goodSide?: 'a' | 'b'
}) {
  const gap = (a.row?.rate ?? 0) - (b.row?.rate ?? 0)
  const tile = (side: 'a' | 'b', item: { label: string; row?: RateRow }) => {
    const higher = side === 'a' ? gap > 0 : gap < 0
    const tone = goodSide ? (goodSide === side ? 'good' : 'bad') : higher ? 'bad' : 'neutral'
    return (
      <div className="rounded-lg bg-subtle p-3">
        <p className="text-body-sm font-medium text-muted">{item.label}</p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span
            className={cx(
              'tnum text-head-md',
              tone === 'bad' ? 'text-rose-600 dark:text-rose-400' : tone === 'good' ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink',
            )}
          >
            {item.row?.count ? pct(item.row.rate) : '—'}
          </span>
          <span className="tnum text-body-sm text-muted">
            {num(item.row?.churned ?? 0)} / {num(item.row?.count ?? 0)}
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-card">
          <div
            className={cx('h-full rounded-full', tone === 'bad' ? 'bg-rose-600' : tone === 'good' ? 'bg-emerald-600' : 'bg-faint')}
            style={{ width: `${(item.row?.rate ?? 0) * 100}%` }}
          />
        </div>
      </div>
    )
  }
  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        tag={<span className="text-brand-text">{icon}</span>}
        right={
          a.row?.count && b.row?.count ? (
            <Tag tone={goodSide ? 'good' : 'bad'}>
              {gap >= 0 ? '+' : '−'}
              {Math.abs(gap * 100).toFixed(1)} pts {a.label.split(' ')[0].toLowerCase()} gap
            </Tag>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 gap-3">
        {tile('a', a)}
        {tile('b', b)}
      </div>
    </Card>
  )
}
