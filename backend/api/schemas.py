from typing import Literal

from pydantic import BaseModel, Field


class Customer(BaseModel):
    CreditScore: int = Field(ge=300, le=900, examples=[650])
    Geography: Literal["France", "Germany", "Spain"]
    Gender: Literal["Female", "Male"]
    Age: int = Field(ge=18, le=100, examples=[40])
    Tenure: int = Field(ge=0, le=10, examples=[5])
    Balance: float = Field(ge=0, examples=[75000])
    NumOfProducts: int = Field(ge=1, le=4, examples=[2])
    HasCrCard: Literal[0, 1]
    IsActiveMember: Literal[0, 1]
    EstimatedSalary: float = Field(ge=0, examples=[100000])


class Factor(BaseModel):
    feature: str
    label: str
    note: str
    impact: float  # change in churn probability (0–1 scale), + raises risk


class Action(BaseModel):
    feature: str | None
    title: str
    detail: str
    cta: str


class Prediction(BaseModel):
    probability: float
    risk: Literal["low", "medium", "high"]
    will_churn: bool
    threshold: float
    baseline_rate: float
    relative_risk: float
    base_value: float  # average model prediction over the background sample
    total_impact: float  # sum of all 10 feature impacts = probability - base_value
    factors: list[Factor]
    actions: list[Action]
    latency_ms: float
