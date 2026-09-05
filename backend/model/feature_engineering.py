import math
import numpy as np
import pandas as pd

# Standard categorical mapping
INDUSTRY_MAP = {
    "Design": 0,
    "Development": 1,
    "Marketing": 2,
    "Consulting": 3,
    "Photography": 4,
    "Copywriting": 5
}

def compute_derived_features(row):
    """
    Computes all derived features for a single invoice row/dict.
    """
    days_sent = float(row.get("days_since_invoice_sent", 0))
    terms = float(row.get("payment_terms_days", 30))
    if terms <= 0:
        terms = 30.0

    days_overdue = max(0.0, days_sent - terms)
    is_overdue = 1.0 if days_overdue > 0 else 0.0
    overdue_ratio = days_overdue / terms

    past_invoices = float(row.get("client_total_invoices_before_this", 0))
    late_rate = float(row.get("client_late_payment_rate", 0.25))

    # client_reliability_score: 1 - client_late_payment_rate (weighted by number of past invoices, new clients get 0.5)
    if past_invoices == 0:
        client_reliability_score = 0.5
    else:
        # Confidence weight approaches 1 as invoice count reaches 10+
        weight = min(1.0, past_invoices / 10.0)
        raw_reliability = 1.0 - late_rate
        client_reliability_score = (weight * raw_reliability) + ((1.0 - weight) * 0.5)

    amount_vs_avg = float(row.get("amount_vs_client_avg", 1.0))
    amount_risk_flag = 1.0 if amount_vs_avg > 1.5 else 0.0

    # recency_penalty: exponential growth factor based on days_since_invoice_sent (more days = higher urgency)
    # Scaled gracefully so 0 days = 0.0, 30 days = ~0.63, 60 days = ~0.86, 90 days = ~0.95
    recency_penalty = 1.0 - math.exp(-days_sent / 30.0)

    industry_str = str(row.get("client_industry", "Design"))
    industry_code = INDUSTRY_MAP.get(industry_str, 0)

    is_repeat = 1.0 if (bool(row.get("is_repeat_client", False)) or past_invoices > 0) else 0.0

    return {
        "invoice_amount": float(row.get("invoice_amount", 50000)),
        "payment_terms_days": terms,
        "invoice_day_of_week": float(row.get("invoice_day_of_week", 2)),
        "invoice_day_of_month": float(row.get("invoice_day_of_month", 15)),
        "invoice_month": float(row.get("invoice_month", 6)),
        "days_since_invoice_sent": days_sent,
        "client_avg_days_to_pay": float(row.get("client_avg_days_to_pay", 30)),
        "client_late_payment_rate": late_rate,
        "client_total_invoices_before_this": past_invoices,
        "amount_vs_client_avg": amount_vs_avg,
        "is_repeat_client": is_repeat,
        "client_industry_code": industry_code,
        "days_overdue": days_overdue,
        "is_overdue": is_overdue,
        "overdue_ratio": overdue_ratio,
        "client_reliability_score": client_reliability_score,
        "amount_risk_flag": amount_risk_flag,
        "recency_penalty": recency_penalty
    }

def build_features(invoice_dict, client_history_df=None):
    """
    Builds a complete feature vector as a pandas DataFrame from a single invoice dict and optional client history.
    """
    invoice_data = dict(invoice_dict)
    
    # Enrich from client_history_df if available
    client_id = invoice_data.get("client_id")
    if client_history_df is not None and client_id is not None and not client_history_df.empty:
        c_history = client_history_df[client_history_df["client_id"] == client_id]
        if not c_history.empty:
            if "client_avg_days_to_pay" not in invoice_data or invoice_data["client_avg_days_to_pay"] is None:
                invoice_data["client_avg_days_to_pay"] = float(c_history["client_avg_days_to_pay"].iloc[-1])
            if "client_late_payment_rate" not in invoice_data or invoice_data["client_late_payment_rate"] is None:
                invoice_data["client_late_payment_rate"] = float(c_history["client_late_payment_rate"].iloc[-1])
            if "client_total_invoices_before_this" not in invoice_data or invoice_data["client_total_invoices_before_this"] is None:
                invoice_data["client_total_invoices_before_this"] = len(c_history)
            if "client_industry" not in invoice_data or not invoice_data["client_industry"]:
                invoice_data["client_industry"] = str(c_history["client_industry"].iloc[-1])
            if "amount_vs_client_avg" not in invoice_data or invoice_data["amount_vs_client_avg"] is None:
                avg_amt = float(c_history["invoice_amount"].mean())
                inv_amt = float(invoice_data.get("invoice_amount", avg_amt))
                invoice_data["amount_vs_client_avg"] = round(inv_amt / max(avg_amt, 1.0), 2)
            invoice_data["is_repeat_client"] = True

    features = compute_derived_features(invoice_data)
    return pd.DataFrame([features])

def prepare_training_dataset(df):
    """
    Takes a dataframe of raw records and transforms all rows using feature engineering.
    """
    feature_rows = []
    for _, row in df.iterrows():
        feature_rows.append(compute_derived_features(row))
    return pd.DataFrame(feature_rows)
