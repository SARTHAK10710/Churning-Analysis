"""Per-customer explanations, segment notes and retention suggestions.

Explanation method: exact interventional Shapley values (the quantity SHAP
estimates), computed directly because the model has only 10 raw inputs.
For every one of the 2^10 = 1,024 feature subsets S we predict the customer with
the features in S kept and the rest taken from a background sample of real
customers, then combine the subset values with the Shapley weights. The impacts
add up exactly to (customer's probability − average background probability),
in probability units. Positive = pushes the customer towards leaving.
"""

from math import factorial

import numpy as np
import pandas as pd

from .features import FEATURE_LABELS, FEATURES, TARGET

N_FEATURES = len(FEATURES)
_MASKS = ((np.arange(2**N_FEATURES)[:, None] >> np.arange(N_FEATURES)) & 1).astype(bool)
_SIZES = _MASKS.sum(axis=1)
_WEIGHTS = np.array(
    [factorial(s) * factorial(N_FEATURES - s - 1) / factorial(N_FEATURES) for s in range(N_FEATURES)]
)

RISK_BANDS = (("low", 0.0, 0.30), ("medium", 0.30, 0.60), ("high", 0.60, 1.01))
AGE_BINS = [17, 30, 40, 50, 60, 120]
AGE_LABELS = ["18–30", "31–40", "41–50", "51–60", "60+"]


def risk_level(probability: float) -> str:
    for name, low, high in RISK_BANDS:
        if low <= probability < high:
            return name
    return "high"


def feature_impacts(pipeline, background: pd.DataFrame, customer: pd.DataFrame, n_background: int = 100):
    """Exact Shapley values for a single-row DataFrame.

    Returns (probability, base_value, {feature: impact}) where
    base_value + sum(impacts) == probability.
    """
    bg = background[FEATURES].iloc[:n_background].to_numpy(dtype=object)
    x = customer[FEATURES].to_numpy(dtype=object)[0]
    n_bg = len(bg)

    # (subsets, background rows, features): customer value where the mask is set.
    grid = np.where(_MASKS[:, None, :], x[None, None, :], bg[None, :, :])
    preds = pipeline.predict_proba(pd.DataFrame(grid.reshape(-1, N_FEATURES), columns=FEATURES))[:, 1]
    value = preds.reshape(len(_MASKS), n_bg).mean(axis=1)  # v(S) for every subset

    impacts = {}
    for i, feature in enumerate(FEATURES):
        without = ~_MASKS[:, i]
        idx = np.flatnonzero(without)
        impacts[feature] = float(np.sum(_WEIGHTS[_SIZES[idx]] * (value[idx + (1 << i)] - value[idx])))

    return float(value[-1]), float(value[0]), impacts


class SegmentStats:
    """Churn rates of real customer segments, used to annotate explanations."""

    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.overall = float(df[TARGET].mean())

    def _rate(self, mask) -> tuple[float, int]:
        sub = self.df.loc[mask, TARGET]
        return (float(sub.mean()) if len(sub) else self.overall), int(len(sub))

    def note(self, feature: str, value) -> str:
        df = self.df
        if feature == "Age":
            idx = np.digitize([value], AGE_BINS[1:-1], right=True)[0]
            low, high = AGE_BINS[idx], AGE_BINS[idx + 1]
            rate, _ = self._rate((df.Age > low) & (df.Age <= high))
            return f"Age {AGE_LABELS[idx]} group churns {rate:.1%}"
        if feature == "Geography":
            rate, _ = self._rate(df.Geography == value)
            return f"{value} customers churn {rate:.1%}"
        if feature == "Gender":
            rate, _ = self._rate(df.Gender == value)
            return f"{value} customers churn {rate:.1%}"
        if feature == "NumOfProducts":
            rate, n = self._rate(df.NumOfProducts == value)
            return f"{int(value)}-product customers churn {rate:.1%} (n={n:,})"
        if feature == "IsActiveMember":
            rate, _ = self._rate(df.IsActiveMember == value)
            return f"{'Active' if value else 'Inactive'} members churn {rate:.1%}"
        if feature == "HasCrCard":
            rate, _ = self._rate(df.HasCrCard == value)
            return f"{'Card holders' if value else 'No-card customers'} churn {rate:.1%}"
        if feature == "Balance":
            zero = value == 0
            rate, _ = self._rate((df.Balance == 0) == zero)
            return f"{'Zero' if zero else 'Non-zero'}-balance customers churn {rate:.1%}"
        if feature == "Tenure":
            rate, _ = self._rate(df.Tenure == value)
            return f"{int(value)}-year tenure churns {rate:.1%}"
        if feature in ("CreditScore", "EstimatedSalary"):
            q = df[feature].quantile([0.25, 0.5, 0.75]).to_numpy()
            band = int(np.searchsorted(q, value))
            edges = [-np.inf, *q, np.inf]
            rate, _ = self._rate((df[feature] > edges[band]) & (df[feature] <= edges[band + 1]))
            names = ["bottom quarter", "lower-middle", "upper-middle", "top quarter"]
            return f"{names[band].capitalize()} of customers churns {rate:.1%}"
        return ""


def value_label(feature: str, value) -> str:
    if feature == "Age":
        return f"Age {int(value)}"
    if feature == "Geography":
        return f"Country: {value}"
    if feature == "Gender":
        return str(value)
    if feature == "NumOfProducts":
        n = int(value)
        return f"{n} product{'s' if n != 1 else ''}"
    if feature == "IsActiveMember":
        return "Active member" if value else "Inactive member"
    if feature == "HasCrCard":
        return "Has credit card" if value else "No credit card"
    if feature == "Balance":
        return f"Balance €{value:,.0f}"
    if feature == "EstimatedSalary":
        return f"Salary €{value:,.0f}"
    if feature == "CreditScore":
        return f"Credit score {int(value)}"
    if feature == "Tenure":
        return f"Tenure {int(value)} yr{'s' if int(value) != 1 else ''}"
    return f"{FEATURE_LABELS.get(feature, feature)}: {value}"


def retention_actions(customer: dict, impacts: dict, risk: str, stats: SegmentStats) -> list[dict]:
    """Rule-based playbook driven by the features that raise this customer's risk."""
    df = stats.df
    playbook = {
        "IsActiveMember": (
            not customer["IsActiveMember"],
            "Re-engagement campaign",
            f"Inactive members churn {stats._rate(df.IsActiveMember == 0)[0]:.1%} vs "
            f"{stats._rate(df.IsActiveMember == 1)[0]:.1%} for active ones. "
            "Trigger app and branch re-engagement.",
            "Queue campaign",
        ),
        "NumOfProducts": (
            customer["NumOfProducts"] != 2,
            "Review product holding",
            (
                f"Customers with 3+ products churn {stats._rate(df.NumOfProducts >= 3)[0]:.1%}. "
                "Check for fee or bundle friction."
                if customer["NumOfProducts"] >= 3
                else f"2-product customers churn least ({stats._rate(df.NumOfProducts == 2)[0]:.1%}). "
                "Cross-sell a savings or card product."
            ),
            "Review products",
        ),
        "Age": (
            41 <= customer["Age"] <= 60,
            "Assign a relationship manager",
            "Customers aged 41–60 are the highest-churn group. "
            "Personal outreach within 24h for high-value accounts.",
            "Assign RM",
        ),
        "Geography": (
            customer["Geography"] == "Germany",
            "Localised retention offer",
            f"German customers churn {stats._rate(df.Geography == 'Germany')[0]:.1%}, about 2× France "
            "and Spain. Offer a market-specific rate or fee review.",
            "Send offer",
        ),
        "Balance": (
            customer["Balance"] > 0,
            "Loyalty rate review",
            "Customers holding a balance churn more than zero-balance ones. "
            "Review deposit rate competitiveness.",
            "Review rate",
        ),
    }
    ranked = sorted(impacts.items(), key=lambda kv: kv[1], reverse=True)
    actions = []
    for feature, impact in ranked:
        rule = playbook.get(feature)
        if rule and rule[0] and impact > 0.005:
            _, title, detail, cta = rule
            actions.append({"feature": feature, "title": title, "detail": detail, "cta": cta})
        if len(actions) == 3:
            break
    if not actions:
        actions.append(
            {
                "feature": None,
                "title": "Standard engagement",
                "detail": "No strong churn drivers detected. Keep in the regular engagement cycle "
                "and re-score quarterly.",
                "cta": "Schedule review",
            }
            if risk == "low"
            else {
                "feature": None,
                "title": "Manual account review",
                "detail": "Risk is elevated without a single dominant driver. "
                "Review recent account activity.",
                "cta": "Open review",
            }
        )
    return actions
