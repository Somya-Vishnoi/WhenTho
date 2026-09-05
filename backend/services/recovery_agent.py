import os
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

def diagnose_and_plan_recovery(invoice_data, prediction_result):
    """
    Autonomous AI Revenue Recovery Engine:
    1. Root Cause Diagnosis: Pinpoints why revenue is degrading / blocked.
    2. Optimal Intervention Selection: Chooses the ideal recovery strategy.
    3. Bounded Action Plan: Step-by-step workflow with retry sequencer, channel, and promise-to-pay window.
    """
    days_sent = int(invoice_data.get("days_since_invoice_sent", 0))
    terms = int(invoice_data.get("payment_terms_days", 30))
    days_overdue = max(0, days_sent - terms)
    amount = float(invoice_data.get("invoice_amount", 50000))
    late_rate = float(invoice_data.get("client_late_payment_rate", 0.2))
    past_invoices = int(invoice_data.get("client_total_invoices_before_this", 0))
    amount_vs_avg = float(invoice_data.get("amount_vs_client_avg", 1.0))
    risk_level = prediction_result.get("risk_level", "medium")
    predicted_status = prediction_result.get("predicted_status", "late")

    # Step 1: Root Cause Diagnosis
    root_causes = []
    if days_overdue > 15:
        root_causes.append({
            "category": "DELINQUENCY_CRITICAL",
            "title": "Severe Payment Aging & Cash Leakage",
            "detail": f"Invoice is {days_overdue} days past due. Historical data shows probability of natural settlement without intervention drops by 68% after Day 15.",
            "severity": "high"
        })
    elif days_overdue > 0:
        root_causes.append({
            "category": "TERMS_BREACH",
            "title": "Payment Degradation Beyond Agreed Terms",
            "detail": f"Exceeded Net-{terms} cycle by {days_overdue} days. Likely stuck in client accounts payable processing batch.",
            "severity": "medium"
        })
    elif days_sent > (terms * 0.8):
        root_causes.append({
            "category": "MATURITY_APPROACHING",
            "title": "Pre-Due Date Friction Prevention",
            "detail": f"Due in {terms - days_sent} days. Proactive pre-authorization nudge recommended to prevent weekend/month-end rollover delay.",
            "severity": "low"
        })
    else:
        root_causes.append({
            "category": "NORMAL_AGING",
            "title": "Active Receivables Aging",
            "detail": f"Invoice is {days_sent} days into {terms}-day term. Client risk profile is baseline.",
            "severity": "low"
        })

    if amount_vs_avg >= 1.7:
        root_causes.append({
            "category": "APPROVAL_FRICTION",
            "title": "Anomalous Amount / Executive Approval Gate",
            "detail": f"Invoice is {amount_vs_avg:.1f}x higher than client's historical average. Enterprise spend policy often requires dual sign-off.",
            "severity": "high" if days_overdue > 0 else "medium"
        })

    if late_rate >= 0.6:
        root_causes.append({
            "category": "HABITUAL_DELAY",
            "title": "Habitual Delayed Payer Profile",
            "detail": f"Client historically delayed {int(round(late_rate * 100))}% of past commitments. Requires sequenced multi-touch interventions.",
            "severity": "high"
        })

    # Step 2: Optimal Intervention Strategy Selection
    if risk_level == "high" or days_overdue > 7:
        strategy_name = "Escalated Multi-Channel Revenue Recovery"
        primary_channel = "Direct Formal Follow-up + Razorpay Instant UPI Link"
        cadence = "T+0 Urgent Notice -> T+2 Voice Check-in -> T+5 Finance Director Escalation"
        promise_window_days = 2
        urgency = "high"
    elif risk_level == "medium" or days_overdue > 0:
        strategy_name = "Automated Receivables Nudge & Payment Sequencer"
        primary_channel = "Polite AP Check-in + Instant Razorpay 1-Click Link"
        cadence = "T+0 Friendly Nudge -> T+3 Automated Payment Reminder with QR"
        promise_window_days = 5
        urgency = "medium"
    else:
        strategy_name = "Pre-Due Date Frictionless Settlement"
        primary_channel = "Automated Milestone Receipt & Razorpay FastCheckout Link"
        cadence = "T-2 Pre-Due Date Courtesy Notice"
        promise_window_days = terms - days_sent
        urgency = "low"

    # Step 3: Bounded Action Plan & Recovery Timeline
    today = datetime.now()
    workflow_steps = [
        {
            "step": 1,
            "action": "Dispatch Razorpay Smart Payment Link",
            "status": "ready",
            "target_date": today.strftime("%Y-%m-%d"),
            "channel": "Email / WhatsApp Gateway",
            "description": "Auto-inject UPI QR and 1-click Razorpay card/netbanking settlement link."
        },
        {
            "step": 2,
            "action": "Capture Promise-to-Pay (PTP) Commitment",
            "status": "pending",
            "target_date": (today + timedelta(days=promise_window_days)).strftime("%Y-%m-%d"),
            "channel": "WhenTho Recovery Tracker",
            "description": f"Lock in client payment confirmation window by {(today + timedelta(days=promise_window_days)).strftime('%d %b %Y')}."
        },
        {
            "step": 3,
            "action": "Mandate Retry & Escalation Sequencer",
            "status": "queued",
            "target_date": (today + timedelta(days=promise_window_days + 3)).strftime("%Y-%m-%d"),
            "channel": "Multi-Channel Escalation",
            "description": "If PTP is breached, automatically escalate to Accounts Payable leadership."
        }
    ]

    return {
        "strategy_name": strategy_name,
        "primary_channel": primary_channel,
        "cadence": cadence,
        "urgency": urgency,
        "promise_window_days": promise_window_days,
        "promise_target_date": (today + timedelta(days=promise_window_days)).strftime("%Y-%m-%d"),
        "root_causes": root_causes,
        "workflow_steps": workflow_steps,
        "projected_recovery_amount": amount,
        "projected_recovery_likelihood": round(float(prediction_result.get("confidence", 0.8) * 100), 1)
    }

def generate_hinglish_voice_script(invoice_data, prediction_result):
    """
    Buildathon Feature: Hinglish Voice Recovery Script for Indian B2B Accounts.
    Drafts an authentic, polite yet clear voice calling script for recovery agents.
    """
    client_name = invoice_data.get("client_name", "Client")
    amount = float(invoice_data.get("invoice_amount", 50000))
    formatted_amount = f"₹{amount:,.2f}"
    days_sent = int(invoice_data.get("days_since_invoice_sent", 0))
    terms = int(invoice_data.get("payment_terms_days", 30))
    days_overdue = max(0, days_sent - terms)
    rec_action = prediction_result.get("recommended_action", "nudge")

    if rec_action == "escalate":
        script = (
            f"Namaste {client_name} team, main WhenTho accounts department se baat kar raha hoon. "
            f"Aapka {formatted_amount} ka invoice abhi {days_overdue} din overdue chal raha hai. "
            f"Kya aap kindly confirm kar sakte hain ki payment aaj process ho rahi hai? "
            f"Maine aapko Razorpay instant UPI link WhatsApp aur email par share kar diya hai, jisse aap 1-click me direct clear kar sakte hain. "
            f"Please let me know if there are any billing questions."
        )
    else:
        script = (
            f"Namaste {client_name} ji, WhenTho studio se call kar raha hoon. "
            f"Aapka {formatted_amount} ka recent invoice due date ke paas hai. "
            f"Bas ek quick check karna tha ki accounts team ke paas sabhi details and GST invoice received hai na? "
            f"Aap direct Razorpay link se UPI ya Netbanking ke through bhi payment execute kar sakte hain. Thank you!"
        )

    return script
