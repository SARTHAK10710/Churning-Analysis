"""Feature definitions and the encoder shared by training and serving.

The encoding reproduces the original model scripts exactly:
  * Gender      -> LabelEncoder order (Female=0, Male=1)
  * Geography   -> one-hot with France as the dropped reference column
  * column order matches ``pd.get_dummies(..., drop_first=True)`` output
so the metrics from the API match the ones from the standalone scripts.
"""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = REPO_ROOT / "Churn_Modelling.csv"

TARGET = "Exited"
ID_COLUMNS = ["RowNumber", "CustomerId", "Surname"]

# Raw model inputs, in the order a user fills them in.
FEATURES = [
    "CreditScore",
    "Geography",
    "Gender",
    "Age",
    "Tenure",
    "Balance",
    "NumOfProducts",
    "HasCrCard",
    "IsActiveMember",
    "EstimatedSalary",
]

# Columns after encoding (what the scaler and model see).
ENCODED = [
    "CreditScore",
    "Gender",
    "Age",
    "Tenure",
    "Balance",
    "NumOfProducts",
    "HasCrCard",
    "IsActiveMember",
    "EstimatedSalary",
    "Geography_Germany",
    "Geography_Spain",
]

GEOGRAPHIES = ("France", "Germany", "Spain")
GENDERS = ("Female", "Male")

FEATURE_LABELS = {
    "CreditScore": "Credit score",
    "Geography": "Country",
    "Gender": "Gender",
    "Age": "Age",
    "Tenure": "Tenure",
    "Balance": "Balance",
    "NumOfProducts": "Number of products",
    "HasCrCard": "Has credit card",
    "IsActiveMember": "Active member",
    "EstimatedSalary": "Estimated salary",
    "Geography_Germany": "Germany",
    "Geography_Spain": "Spain",
}


class ChurnEncoder(BaseEstimator, TransformerMixin):
    """Turns raw customer rows into the numeric matrix the model was trained on."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = pd.DataFrame(X)[FEATURES].copy()
        X["Gender"] = (X["Gender"] == "Male").astype(int)
        for country in ("Germany", "Spain"):
            X[f"Geography_{country}"] = (X["Geography"] == country).astype(int)
        return X.drop(columns=["Geography"])[ENCODED].astype(float).to_numpy()

    def get_feature_names_out(self, input_features=None):
        return np.array(ENCODED)


def load_dataset() -> pd.DataFrame:
    return pd.read_csv(DATA_PATH)
