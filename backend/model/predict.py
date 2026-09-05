import os
import joblib
import numpy as np
import pandas as pd
from feature_engineering import build_features

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
COLUMNS_PATH = os.path.join(os.path.dirname(__file__), "feature_columns.pkl")
META_PATH = os.path.join(os.path.dirname(__file__), "metadata.pkl")

# Cached model & columns
_model = None
_feature_columns = None
_metadata = None

def reload_model_artifacts():
    global _model, _feature_columns, _metadata
    _model = None
    _feature_columns = None
    _metadata = None
    return _get_model_artifacts()

def _get_model_artifacts():
    global _model, _feature_columns, _metadata
    if _model is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(COLUMNS_PATH):
            raise FileNotFoundError("Trained model or feature columns not found. Please train the model first.")
        _model = joblib.load(MODEL_PATH)
        _feature_columns = joblib.load(COLUMNS_PATH)
        if os.path.exists(META_PATH):
            _metadata = joblib.load(META_PATH)
        else:
            _metadata = {"inverse_label_mapping": {0: "on_time", 1: "late", 2: "very_late"}}
    return _model, _feature_columns, _metadata

def generate_plain_english_reason(features_dict, predicted_status, risk_level):
    """
    Generates a clear, human-like deterministic explanation based on features.
    No score dump — genuine human-readable reasoning.
    """
    reasons = []
    
    days_sent = features_dict.get("days_since_invoice_sent", 0)
    terms = features_dict.get("payment_terms_days", 30)
    days_overdue = features_dict.get("days_overdue", 0)
    late_rate = features_dict.get("client_late_payment_rate", 0.0)
    past_invoices = features_dict.get("client_total_invoices_before_this", 0)
    amount_vs_avg = features_dict.get("amount_vs_client_avg", 1.0)
    avg_days_to_pay = features_dict.get("client_avg_days_to_pay", 30)
    is_repeat = features_dict.get("is_repeat_client", 0)

    # 1. Overdue status
    if days_overdue > 15:
        reasons.append(f"This invoice is critically overdue by {int(days_overdue)} days (terms: {int(terms)} days).")
    elif days_overdue > 0:
        reasons.append(f"This invoice is currently {int(days_overdue)} days past its {int(terms)}-day due date.")
    elif days_sent > (terms * 0.8):
        reasons.append(f"Invoice due date is approaching in {int(terms - days_sent)} days.")
    else:
        reasons.append(f"Sent {int(days_sent)} days ago within standard {int(terms)}-day payment terms.")

    # 2. Client payment track record
    if past_invoices == 0 or not is_repeat:
        reasons.append("New client with no established payment track record — baseline uncertainty.")
    else:
        late_pct = int(round(late_rate * 100))
        if late_pct >= 60:
            reasons.append(f"Client has paid late on {late_pct}% of past invoices (averaging {int(avg_days_to_pay)} days to settle).")
        elif late_pct <= 15:
            reasons.append(f"Client is highly reliable ({100 - late_pct}% on-time payment track record).")
        else:
            reasons.append(f"Client settles invoices with occasional delays (~{late_pct}% late rate across {int(past_invoices)} invoices).")

    # 3. Invoice size anomaly
    if amount_vs_avg >= 1.8:
        reasons.append(f"This invoice is {amount_vs_avg:.1f}x larger than their typical invoice amount, triggering extra review.")
    elif amount_vs_avg <= 0.6:
        reasons.append("Invoice amount is lower than typical, making approval friction minimal.")

    return " ".join(reasons)

def calculate_days_until_likely_payment(features_dict, predicted_status):
    """
    Estimates integer days remaining until likely payment.
    """
    days_sent = features_dict.get("days_since_invoice_sent", 0)
    terms = features_dict.get("payment_terms_days", 30)
    avg_days_to_pay = features_dict.get("client_avg_days_to_pay", 30)

    if predicted_status == "on_time":
        expected_total_days = min(terms, avg_days_to_pay)
        remaining = max(1, int(round(expected_total_days - days_sent)))
    elif predicted_status == "late":
        expected_total_days = max(terms + 5, avg_days_to_pay + 4)
        remaining = max(2, int(round(expected_total_days - days_sent)))
    else: # very_late
        expected_total_days = max(terms + 20, avg_days_to_pay + 18, days_sent + 12)
        remaining = max(5, int(round(expected_total_days - days_sent)))

    return remaining

def compute_survival_curve(expected_days, risk_level):
    """
    Computes a realistic 30-day cumulative settlement probability curve (time-to-event survival model).
    Returns array of { day: int, probability: float (0-100) } for days [3, 7, 14, 21, 30].
    """
    checkpoints = [3, 7, 14, 21, 30]
    curve = []
    
    # Sigmoid / logistic style cumulative distribution centered around expected_days
    # k controls slope steepness
    k = 0.18 if risk_level == "low" else (0.12 if risk_level == "medium" else 0.08)
    
    for d in checkpoints:
        # P(paid by day d from today)
        exponent = -k * (d - expected_days)
        prob = 1.0 / (1.0 + np.exp(exponent))
        # Ensure smooth monotonic progression
        pct = round(float(np.clip(prob * 100, 5.0, 98.0)), 1)
        curve.append({
            "day": d,
            "label": f"+{d}d",
            "probability": pct
        })
    return curve

def predict_invoice(invoice_data, client_history_df=None):
    """
    Main prediction logic for WhenTho.
    Takes invoice data dict and returns status, confidence, probabilities, risk level,
    human-like explanation, expected payment days, survival curve, and recommended action.
    """
    model, feature_cols, meta = _get_model_artifacts()
    inv_features_df = build_features(invoice_data, client_history_df)
    
    X_pred = inv_features_df[feature_cols]
    
    proba = model.predict_proba(X_pred)[0]
    p_on_time = float(proba[0])
    p_late = float(proba[1])
    p_very_late = float(proba[2])
    
    probabilities = {
        "on_time": round(p_on_time, 3),
        "late": round(p_late, 3),
        "very_late": round(p_very_late, 3)
    }

    pred_class_idx = int(np.argmax(proba))
    inverse_map = meta.get("inverse_label_mapping", {0: "on_time", 1: "late", 2: "very_late"})
    predicted_status = inverse_map.get(pred_class_idx, "on_time")
    confidence = round(float(proba[pred_class_idx]), 3)

    if predicted_status == "very_late" or (p_late + p_very_late >= 0.70):
        risk_level = "high"
    elif predicted_status == "late" or (p_late + p_very_late >= 0.35):
        risk_level = "medium"
    else:
        risk_level = "low"

    feat_row = inv_features_df.iloc[0].to_dict()
    days_overdue = feat_row.get("days_overdue", 0)

    plain_english_reason = generate_plain_english_reason(feat_row, predicted_status, risk_level)
    days_until_likely_payment = calculate_days_until_likely_payment(feat_row, predicted_status)
    survival_curve = compute_survival_curve(days_until_likely_payment, risk_level)

    if predicted_status == "very_late" or days_overdue > 7:
        recommended_action = "escalate"
    elif risk_level == "medium" or (0 < days_overdue <= 7):
        recommended_action = "nudge"
    else:
        recommended_action = "wait"

    return {
        "predicted_status": predicted_status,
        "confidence": confidence,
        "probabilities": probabilities,
        "risk_level": risk_level,
        "plain_english_reason": plain_english_reason,
        "days_until_likely_payment": days_until_likely_payment,
        "survival_curve": survival_curve,
        "recommended_action": recommended_action
    }

if __name__ == "__main__":
    test_sample = {
        "client_id": "CL-1002",
        "client_industry": "Marketing",
        "invoice_amount": 120000,
        "payment_terms_days": 30,
        "days_since_invoice_sent": 38,
        "client_avg_days_to_pay": 45.0,
        "client_late_payment_rate": 0.75,
        "client_total_invoices_before_this": 5,
        "amount_vs_client_avg": 2.1,
        "is_repeat_client": True
    }
    result = predict_invoice(test_sample)
    print("Test Prediction Output with Survival Curve:")
    for k, v in result.items():
        print(f"  {k}: {v}")
