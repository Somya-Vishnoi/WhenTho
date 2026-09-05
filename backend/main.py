import os
import sys
import json
import uuid
import subprocess
from collections import defaultdict
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from concurrent.futures import ThreadPoolExecutor

# Ensure backend root and backend/model are in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
model_dir = os.path.join(backend_dir, "model")
if model_dir not in sys.path:
    sys.path.insert(0, model_dir)

from fastapi import FastAPI, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

from predict import predict_invoice, reload_model_artifacts
from services.email_generator import generate_followup_email
from services.recovery_agent import diagnose_and_plan_recovery, generate_hinglish_voice_script

app = FastAPI(
    title="WhenTho API - Razorpay AI Revenue Recovery Engine",
    description="AI Revenue Recovery: Detect degradation, diagnose root causes, execute bounded interventions, and track promises to pay.",
    version="2.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(backend_dir, "invoices_db.json")
CSV_PATH = os.path.join(backend_dir, "data", "invoices.csv")
LOG_PATH = os.path.join(backend_dir, "prediction_outcomes.json")

def load_outcome_log():
    if not os.path.exists(LOG_PATH):
        return []
    try:
        with open(LOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_outcome_log(data):
    with open(LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

_client_history_df = None

def get_client_history():
    global _client_history_df
    if _client_history_df is None:
        if os.path.exists(CSV_PATH):
            _client_history_df = pd.read_csv(CSV_PATH)
        else:
            _client_history_df = pd.DataFrame()
    return _client_history_df

_in_memory_db = None

def load_db() -> List[Dict[str, Any]]:
    global _in_memory_db
    if _in_memory_db is not None:
        return _in_memory_db

    if not os.path.exists(DB_PATH):
        seed_initial_invoices()
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            _in_memory_db = json.load(f)
            return _in_memory_db
    except Exception:
        _in_memory_db = []
        return _in_memory_db

def save_db(data: List[Dict[str, Any]]):
    global _in_memory_db
    _in_memory_db = data
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def seed_initial_invoices():
    df = get_client_history()
    sample_invoices = []
    
    client_name_map = {
        "CL-1000": "Studio Monochrome",
        "CL-1001": "Nexora Digital",
        "CL-1002": "Apex Global Labs",
        "CL-1003": "Kavita Designs",
        "CL-1004": "Zenith AI Corp",
        "CL-1005": "Verve Branding",
        "CL-1006": "Aarav Tech Solutions",
        "CL-1007": "Pulse Media Group",
        "CL-1008": "Drift Studio",
        "CL-1009": "Helios Logistics",
        "CL-1010": "Quantum Leap Interactive"
    }

    if not df.empty:
        rows = pd.concat([
            df[df["payment_status"] == "very_late"].head(5),
            df[df["payment_status"] == "late"].head(3),
            df[df["payment_status"] == "on_time"].head(4)
        ]).to_dict(orient="records")

        for r in rows:
            cid = r.get("client_id", "CL-1000")
            cname = client_name_map.get(cid, f"Client {cid}")
            days_sent = int(r.get("days_since_invoice_sent", 20))
            inv_date = (datetime.now() - pd.Timedelta(days=days_sent)).strftime("%Y-%m-%d")
            
            item = {
                "invoice_id": r.get("invoice_id"),
                "client_id": cid,
                "client_name": cname,
                "client_email": f"billing@{cname.lower().replace(' ', '')}.com",
                "invoice_amount": float(r.get("invoice_amount", 45000)),
                "payment_terms_days": int(r.get("payment_terms_days", 30)),
                "invoice_date": inv_date,
                "days_since_invoice_sent": days_sent,
                "status": "unpaid",
                "payment_channel": "razorpay_invoicing",
                "description": f"{r.get('client_industry', 'Creative')} retainer milestone delivery",
                "client_industry": r.get("client_industry", "Design"),
                "client_avg_days_to_pay": float(r.get("client_avg_days_to_pay", 30)),
                "client_late_payment_rate": float(r.get("client_late_payment_rate", 0.2)),
                "client_total_invoices_before_this": int(r.get("client_total_invoices_before_this", 4)),
                "amount_vs_client_avg": float(r.get("amount_vs_client_avg", 1.0)),
                "is_repeat_client": bool(r.get("is_repeat_client", True)),
                "dispatches": [],
                "promise_to_pay": None
            }
            sample_invoices.append(item)
    else:
        sample_invoices = [
            {
                "invoice_id": "INV-10001",
                "client_id": "CL-1002",
                "client_name": "Apex Global Labs",
                "client_email": "finance@apexlabs.com",
                "invoice_amount": 145000.0,
                "payment_terms_days": 30,
                "invoice_date": "2026-07-20",
                "days_since_invoice_sent": 47,
                "status": "unpaid",
                "payment_channel": "razorpay_invoicing",
                "description": "Quarterly UI/UX Redesign & Brand Architecture",
                "client_industry": "Design",
                "client_avg_days_to_pay": 52.0,
                "client_late_payment_rate": 0.75,
                "client_total_invoices_before_this": 6,
                "amount_vs_client_avg": 2.1,
                "is_repeat_client": True,
                "dispatches": [],
                "promise_to_pay": None
            }
        ]

    save_db(sample_invoices)

class CreateInvoiceRequest(BaseModel):
    client_name: str
    client_id: str
    client_email: Optional[str] = "accounts@client.com"
    invoice_amount: float
    payment_terms_days: int
    invoice_date: str
    description: Optional[str] = "Professional consulting and delivery services"
    create_razorpay_link: Optional[bool] = True

class SendEmailRequest(BaseModel):
    email_subject: str
    email_body: str
    recipient_email: Optional[str] = None

class PromiseToPayRequest(BaseModel):
    promised_date: str
    notes: Optional[str] = "Client committed to wire transfer via Razorpay link"
    recorded_by: Optional[str] = "Finance Recovery Lead"

class MarkPaidRequest(BaseModel):
    payment_channel: Optional[str] = "razorpay_instant"
    paid_date: Optional[str] = None

RISK_SORT_ORDER = {"high": 3, "medium": 2, "low": 1}

@app.get("/")
def root():
    return {
        "name": "WhenTho API - Razorpay AI Revenue Recovery",
        "status": "operational",
        "tracks": ["AI Revenue Recovery", "AI Finance Controller"],
        "version": "2.5.0"
    }

@app.get("/invoices")
def get_invoices(status: Optional[str] = None):
    db = load_db()
    c_df = get_client_history()
    enriched = []

    for inv in db:
        if status and inv.get("status", "unpaid") != status:
            continue

        if "invoice_date" in inv and inv.get("status") != "paid":
            try:
                inv_dt = datetime.strptime(inv["invoice_date"], "%Y-%m-%d").date()
                inv["days_since_invoice_sent"] = max(0, (date.today() - inv_dt).days)
            except Exception:
                pass
        
        pred = predict_invoice(inv, c_df)
        item = dict(inv)
        item.update(pred)

        if "razorpay_payment_url" not in item:
            item["razorpay_payment_url"] = f"https://rzp.io/i/whentho_{item['invoice_id'].lower()}"
            item["razorpay_qr_code"] = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=whentho.merchant@razorpay&pn=WhenTho%20Invoice&am={item['invoice_amount']}&cu=INR"

        enriched.append(item)

    enriched.sort(key=lambda x: (
        0 if x.get("status") == "paid" else 1,
        RISK_SORT_ORDER.get(x.get("risk_level", "low"), 0)
    ), reverse=True)
    return enriched

@app.get("/invoices/{invoice_id}")
def get_invoice_detail(invoice_id: str):
    db = load_db()
    match = next((x for x in db if x["invoice_id"] == invoice_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if "invoice_date" in match and match.get("status") != "paid":
        try:
            inv_dt = datetime.strptime(match["invoice_date"], "%Y-%m-%d").date()
            match["days_since_invoice_sent"] = max(0, (date.today() - inv_dt).days)
        except Exception:
            pass

    c_df = get_client_history()
    prediction = predict_invoice(match, c_df)
    
    result = dict(match)
    result.update(prediction)
    
    if "razorpay_payment_url" not in result:
        result["razorpay_payment_url"] = f"https://rzp.io/i/whentho_{result['invoice_id'].lower()}"
        result["razorpay_qr_code"] = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=whentho.merchant@razorpay&pn=WhenTho%20Invoice&am={result['invoice_amount']}&cu=INR"
    
    # Run Revenue Recovery Diagnosis and Bounded Plan (cached on invoice)
    if "recovery_plan" not in match or match.get("status") == "paid":
        match["recovery_plan"] = diagnose_and_plan_recovery(match, prediction)
    if "hinglish_voice_script" not in match:
        match["hinglish_voice_script"] = generate_hinglish_voice_script(match, prediction)

    result["recovery_plan"] = match["recovery_plan"]
    result["hinglish_voice_script"] = match["hinglish_voice_script"]

    return result

@app.get("/invoices/{invoice_id}/risk-projection")
def get_invoice_risk_projection(invoice_id: str):
    db = load_db()
    match = next((x for x in db if x["invoice_id"] == invoice_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Invoice not found")

    base_inv = dict(match)
    if "invoice_date" in base_inv and base_inv.get("status") != "paid":
        try:
            inv_dt = datetime.strptime(base_inv["invoice_date"], "%Y-%m-%d").date()
            current_days = max(0, (date.today() - inv_dt).days)
        except Exception:
            current_days = int(base_inv.get("days_since_invoice_sent", 0))
    else:
        current_days = int(base_inv.get("days_since_invoice_sent", 0))

    c_df = get_client_history()

    def run_projection_day(d: int):
        inv_copy = dict(base_inv)
        inv_copy["days_since_invoice_sent"] = current_days + d
        pred = predict_invoice(inv_copy, c_df)
        return {
            "day": d,
            "days_since_sent": current_days + d,
            "predicted_status": pred["predicted_status"],
            "confidence": pred["confidence"],
            "risk_level": pred["risk_level"],
            "recommended_action": pred["recommended_action"]
        }

    with ThreadPoolExecutor(max_workers=8) as executor:
        projection = list(executor.map(run_projection_day, range(0, 31)))

    return projection

@app.post("/invoices")
def create_invoice(payload: CreateInvoiceRequest):
    db = load_db()
    c_df = get_client_history()

    try:
        inv_dt = datetime.strptime(payload.invoice_date, "%Y-%m-%d").date()
        days_since_sent = max(0, (date.today() - inv_dt).days)
    except Exception:
        days_since_sent = 0

    new_id = f"INV-{10000 + len(db) + 1}"
    
    c_history = c_df[c_df["client_id"] == payload.client_id] if not c_df.empty else pd.DataFrame()
    if not c_history.empty:
        avg_days = float(c_history["client_avg_days_to_pay"].iloc[-1])
        late_rate = float(c_history["client_late_payment_rate"].iloc[-1])
        past_inv_count = len(c_history)
        industry = str(c_history["client_industry"].iloc[-1])
        avg_amt = float(c_history["invoice_amount"].mean())
        amount_vs_avg = round(payload.invoice_amount / max(avg_amt, 1.0), 2)
        is_repeat = True
    else:
        avg_days = 30.0
        late_rate = 0.25
        past_inv_count = 0
        industry = "Consulting"
        amount_vs_avg = 1.0
        is_repeat = False

    rzp_url = f"https://rzp.io/i/whentho_{new_id.lower()}"
    rzp_qr = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=whentho.merchant@razorpay&pn=WhenTho%20Invoice&am={payload.invoice_amount}&cu=INR"

    inv_record = {
        "invoice_id": new_id,
        "client_id": payload.client_id,
        "client_name": payload.client_name,
        "client_email": payload.client_email or f"billing@{payload.client_id.lower()}.com",
        "invoice_amount": float(payload.invoice_amount),
        "payment_terms_days": int(payload.payment_terms_days),
        "invoice_date": payload.invoice_date,
        "days_since_invoice_sent": days_since_sent,
        "status": "unpaid",
        "payment_channel": "razorpay_invoicing",
        "razorpay_payment_url": rzp_url,
        "razorpay_qr_code": rzp_qr,
        "description": payload.description,
        "client_industry": industry,
        "client_avg_days_to_pay": avg_days,
        "client_late_payment_rate": late_rate,
        "client_total_invoices_before_this": past_inv_count,
        "amount_vs_client_avg": amount_vs_avg,
        "is_repeat_client": is_repeat,
        "dispatches": [],
        "promise_to_pay": None
    }

    prediction = predict_invoice(inv_record, c_df)
    full_invoice = dict(inv_record)
    full_invoice.update(prediction)

    db.append(inv_record)
    save_db(db)

    return full_invoice

@app.post("/invoices/{invoice_id}/generate-email")
def generate_email_for_invoice(invoice_id: str):
    db = load_db()
    match = next((x for x in db if x["invoice_id"] == invoice_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Invoice not found")

    c_df = get_client_history()
    prediction = predict_invoice(match, c_df)

    email_result = generate_followup_email(match, prediction)
    
    payment_link = match.get("razorpay_payment_url", f"https://rzp.io/i/whentho_{match['invoice_id'].lower()}")
    email_result["email_body"] = (
        f"{email_result['email_body']}\n\n"
        f"💳 Quick-Pay via Razorpay (UPI, Netbanking, Cards):\n"
        f"{payment_link}"
    )
    email_result["recipient_email"] = match.get("client_email", "billing@client.com")
    return email_result

@app.post("/invoices/{invoice_id}/send-email")
def send_email_for_invoice(invoice_id: str, payload: SendEmailRequest):
    db = load_db()
    match = next((x for x in db if x["invoice_id"] == invoice_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Invoice not found")

    recipient = payload.recipient_email or match.get("client_email", "billing@client.com")
    
    dispatch_record = {
        "dispatch_id": f"DSP-{uuid.uuid4().hex[:8].upper()}",
        "sent_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "recipient": recipient,
        "subject": payload.email_subject,
        "status": "delivered",
        "provider": "WhenTho Dispatch Gateway (SMTP/OAuth)"
    }
    
    if "dispatches" not in match:
        match["dispatches"] = []
    match["dispatches"].insert(0, dispatch_record)
    save_db(db)

    return {
        "success": True,
        "message": f"Follow-up successfully delivered to {recipient}",
        "dispatch": dispatch_record
    }

@app.post("/invoices/{invoice_id}/promise-to-pay")
def record_promise_to_pay(invoice_id: str, payload: PromiseToPayRequest):
    """
    Buildathon Feature: Promise-to-Pay (PTP) Tracker.
    Locks in a verified client commitment date and monitors compliance.
    """
    db = load_db()
    match = next((x for x in db if x["invoice_id"] == invoice_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Invoice not found")

    ptp_record = {
        "ptp_id": f"PTP-{uuid.uuid4().hex[:6].upper()}",
        "promised_date": payload.promised_date,
        "recorded_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "notes": payload.notes,
        "status": "active",
        "recorded_by": payload.recorded_by
    }
    match["promise_to_pay"] = ptp_record
    save_db(db)

    return {
        "success": True,
        "message": f"Promise-to-Pay commitment recorded for {payload.promised_date}",
        "promise_to_pay": ptp_record
    }

@app.post("/invoices/{invoice_id}/mark-paid")
def mark_invoice_as_paid(invoice_id: str, payload: Optional[MarkPaidRequest] = None):
    db = load_db()
    match = next((x for x in db if x["invoice_id"] == invoice_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Invoice not found")

    paid_date_val = (payload.paid_date if payload and payload.paid_date else datetime.now().strftime("%Y-%m-%d"))
    payment_channel = (payload.payment_channel if payload and payload.payment_channel else "razorpay_instant")

    match["status"] = "paid"
    match["paid_at"] = paid_date_val
    match["settled_channel"] = payment_channel
    
    # If a PTP was active, mark it as fulfilled!
    if match.get("promise_to_pay"):
        match["promise_to_pay"]["status"] = "fulfilled"
    
    terms = match.get("payment_terms_days", 30)
    actual_days = match.get("days_since_invoice_sent", 25)
    was_late = 1 if actual_days > terms else 0
    
    # Calculate deterministic actual repayment outcome
    actual_status = "on_time"
    if actual_days > terms + 15:
        actual_status = "very_late"
    elif actual_days > terms:
        actual_status = "late"

    # Get predicted status & risk level from invoice or prediction pipeline
    predicted_status = match.get("predicted_status")
    risk_level = match.get("risk_level")
    if not predicted_status or not risk_level:
        c_df = get_client_history()
        pred = predict_invoice(match, c_df)
        predicted_status = pred.get("predicted_status", "unknown")
        risk_level = pred.get("risk_level", "unknown")

    match["predicted_status"] = predicted_status
    match["risk_level"] = risk_level

    # Append to prediction outcomes log for online continuous learning
    outcome_log = load_outcome_log()
    outcome_log.append({
        "invoice_id": invoice_id,
        "client_id": match.get("client_id", "unknown"),
        "invoice_amount": match.get("invoice_amount", 0.0),
        "predicted_status": predicted_status,
        "actual_status": actual_status,
        "was_correct": (predicted_status == actual_status),
        "risk_level": risk_level,
        "settled_at": datetime.now().isoformat(),
        "days_since_sent": actual_days,
        "payment_terms": terms,
        "settled_channel": payment_channel
    })
    save_outcome_log(outcome_log)

    match["client_total_invoices_before_this"] = match.get("client_total_invoices_before_this", 0) + 1
    old_late_rate = match.get("client_late_payment_rate", 0.2)
    n = match["client_total_invoices_before_this"]
    new_late_rate = ((old_late_rate * (n - 1)) + was_late) / n
    match["client_late_payment_rate"] = round(new_late_rate, 3)

    save_db(db)
    return {
        "success": True,
        "invoice_id": invoice_id,
        "status": "paid",
        "message": f"Invoice {invoice_id} recovered & settled via {payment_channel}!",
        "new_client_late_rate": match["client_late_payment_rate"],
        "actual_status": actual_status,
        "predicted_status": predicted_status,
        "was_correct": (predicted_status == actual_status)
    }

@app.post("/webhooks/razorpay")
def razorpay_webhook(data: Dict[str, Any] = Body(...)):
    event = data.get("event", "payment.captured")
    payload = data.get("payload", {})
    
    print(f"⚡ [Razorpay Webhook Received] Event: {event}")
    payment_entity = payload.get("payment", {}).get("entity", {})
    invoice_id = payment_entity.get("notes", {}).get("invoice_id") or payment_entity.get("description")
    
    db = load_db()
    updated = False
    
    if invoice_id:
        match = next((x for x in db if x["invoice_id"] == invoice_id), None)
        if match and event in ["invoice.paid", "payment.captured"]:
            match["status"] = "paid"
            match["settled_channel"] = "razorpay_webhook"
            match["paid_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            match["razorpay_payment_id"] = payment_entity.get("id", f"pay_{uuid.uuid4().hex[:10]}")
            if match.get("promise_to_pay"):
                match["promise_to_pay"]["status"] = "fulfilled"
            updated = True
            save_db(db)

    return {
        "status": "received",
        "event": event,
        "invoice_reconciled": updated,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/razorpay/simulate-payment/{invoice_id}")
def simulate_razorpay_payment(invoice_id: str):
    return mark_invoice_as_paid(invoice_id, MarkPaidRequest(payment_channel="Razorpay UPI (FastCheckout)"))

@app.get("/dashboard/summary")
def get_dashboard_summary():
    db = load_db()
    c_df = get_client_history()

    total_invoices = len(db)
    total_amount_at_risk = 0.0
    total_portfolio_value = 0.0
    total_collected = 0.0
    high_risk_count = 0
    medium_risk_count = 0
    low_risk_count = 0
    paid_count = 0
    invoices_needing_action = 0
    active_ptp_count = 0

    for inv in db:
        amt = float(inv.get("invoice_amount", 0.0))
        total_portfolio_value += amt
        
        if inv.get("status") == "paid":
            paid_count += 1
            total_collected += amt
            continue

        if inv.get("promise_to_pay") and inv["promise_to_pay"].get("status") == "active":
            active_ptp_count += 1

        pred = predict_invoice(inv, c_df)
        risk = pred.get("risk_level", "low")

        if risk == "high":
            high_risk_count += 1
            total_amount_at_risk += amt
        elif risk == "medium":
            medium_risk_count += 1
            total_amount_at_risk += (amt * 0.5)
        else:
            low_risk_count += 1

        if pred.get("recommended_action") in ["nudge", "escalate"]:
            invoices_needing_action += 1

    return {
        "total_invoices": total_invoices,
        "total_portfolio_value": round(total_portfolio_value, 2),
        "total_amount_at_risk": round(total_amount_at_risk, 2),
        "total_collected": round(total_collected, 2),
        "high_risk_count": high_risk_count,
        "medium_risk_count": medium_risk_count,
        "low_risk_count": low_risk_count,
        "paid_count": paid_count,
        "invoices_needing_action": invoices_needing_action,
        "unpaid_count": total_invoices - paid_count,
        "active_ptp_count": active_ptp_count
    }

@app.get("/clients")
def get_clients_list():
    c_df = get_client_history()
    if c_df.empty:
        return []
    clients = []
    unique_clients = c_df[["client_id", "client_industry"]].drop_duplicates().head(20)
    for _, row in unique_clients.iterrows():
        clients.append({
            "client_id": row["client_id"],
            "client_industry": row["client_industry"]
        })
    return clients

@app.get("/model/performance")
def get_model_performance():
    log = load_outcome_log()
    if not log:
        return {
            "total_predictions_evaluated": 0,
            "overall_accuracy": None,
            "accuracy_by_risk": {},
            "recent_accuracy": None,
            "trend": "insufficient_data",
            "log": []
        }

    # Sort log by settled_at timestamp to ensure robust chronological order
    log_sorted = sorted(log, key=lambda x: str(x.get("settled_at", "")))

    total = len(log_sorted)
    correct = sum(1 for x in log_sorted if x.get("was_correct"))
    overall_accuracy = round(correct / total, 3)

    # Accuracy by risk tier
    risk_buckets = defaultdict(lambda: {"correct": 0, "total": 0})
    for entry in log_sorted:
        r = entry.get("risk_level", "unknown")
        risk_buckets[r]["total"] += 1
        if entry.get("was_correct"):
            risk_buckets[r]["correct"] += 1

    accuracy_by_risk = {
        r: round(v["correct"] / v["total"], 3)
        for r, v in risk_buckets.items()
        if v["total"] > 0
    }

    # Recent accuracy: last 10 settled invoices in chronological sequence
    recent = log_sorted[-10:]
    recent_accuracy = round(
        sum(1 for x in recent if x.get("was_correct")) / len(recent), 3
    )

    # Trend: is recent accuracy better than overall?
    trend = "improving" if recent_accuracy > overall_accuracy else \
            "stable" if abs(recent_accuracy - overall_accuracy) < 0.05 else \
            "degrading"

    return {
        "total_predictions_evaluated": total,
        "overall_accuracy": overall_accuracy,
        "accuracy_by_risk": accuracy_by_risk,
        "recent_accuracy": recent_accuracy,
        "trend": trend,
        "log": log_sorted[-20:]  # Last 20 for the frontend table
    }

@app.post("/model/retrain")
def trigger_retrain():
    log = load_outcome_log()
    
    if len(log) < 5:
        return {
            "success": False,
            "message": f"Need at least 5 settled invoices to retrain. Currently have {len(log)}."
        }

    try:
        train_script = os.path.join(backend_dir, "model", "train.py")
        env = dict(os.environ)
        env["PYTHONPATH"] = f"{backend_dir}:{os.path.join(backend_dir, 'model')}"
        
        result = subprocess.run(
            [sys.executable, train_script],
            capture_output=True,
            text=True,
            timeout=120,
            env=env
        )

        if result.returncode != 0:
            return {
                "success": False,
                "message": "Training script failed.",
                "training_log": (result.stderr[-1000:] if result.stderr else "Non-zero exit status with empty stderr")
            }
        
        # Reload model artifacts into memory
        reload_model_artifacts()

        return {
            "success": True,
            "message": "Model retrained on latest invoice outcomes.",
            "training_log": result.stdout[-1000:] if result.stdout else "Model retrained successfully."
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
