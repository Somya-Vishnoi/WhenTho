import os
import re
import random
import requests
from dotenv import load_dotenv

load_dotenv()

# High-speed Recovery Template Library (15 specialized recovery scenarios)
RECOVERY_TEMPLATES = {
    # 1. Critical Delinquency (>15 days late)
    "escalate_severe": [
        {
            "subject": "Urgent: Final Notice for Outstanding Invoice {amount} - {client_name}",
            "body": (
                "Hi {client_name},\n\n"
                "I am following up regarding your outstanding balance of {amount}, which is now {days_overdue} days past due.\n\n"
                "We have not received payment confirmation or a response to earlier notices. Please arrange payment today to ensure "
                "our accounts remain reconciled and to avoid interruption to ongoing deliverables and services.\n\n"
                "If payment has already been released, please share the UTR / transaction receipt so we can update our records immediately.\n\n"
                "Best regards,\nWhenTho Accounts"
            )
        },
        {
            "subject": "Overdue Notice ({days_overdue} Days Past Terms) - {amount} - {client_name}",
            "body": (
                "Dear {client_name},\n\n"
                "Our records show that invoice {invoice_id} for {amount} remains unsettled, now {days_overdue} days beyond our Net-{terms} terms.\n\n"
                "We require your finance team's immediate confirmation on when this wire/transfer will be initiated. "
                "Kindly verify if there is any dispute or missing documentation holding this up.\n\n"
                "Prompt resolution is essential.\n\n"
                "Sincerely,\nWhenTho Finance Operations"
            )
        },
        {
            "subject": "Action Required: Immediate Settlement of Invoice {amount}",
            "body": (
                "Hi {client_name},\n\n"
                "Writing to urgently request payment for invoice {invoice_id} ({amount}), currently {days_overdue} days overdue.\n\n"
                "Please confirm by end of day when the funds will be transferred. We appreciate your immediate cooperation in bringing this account up to date.\n\n"
                "Regards,\nWhenTho Studio"
            )
        }
    ],

    # 2. Moderate Overdue (1-15 days late)
    "escalate_moderate": [
        {
            "subject": "Payment Follow-up: Invoice for {amount} is {days_overdue} days overdue",
            "body": (
                "Hi {client_name},\n\n"
                "Checking in regarding invoice {invoice_id} for {amount}, which was due {days_overdue} days ago.\n\n"
                "Could you please let us know the expected processing date for this payment? If you need another copy of the invoice "
                "or purchase order cross-reference, let us know.\n\n"
                "Thanks for looking into this.\n\n"
                "Best regards,\nWhenTho Accounts"
            )
        },
        {
            "subject": "Update on Invoice {amount} - Past Due ({client_name})",
            "body": (
                "Hi {client_name},\n\n"
                "Hope your week is going well. Just a quick follow-up on our invoice of {amount} that crossed the {terms}-day due date {days_overdue} days ago.\n\n"
                "Could you verify if this has been submitted to your accounts payable queue for clearance?\n\n"
                "Much appreciated!\n\n"
                "Best,\nWhenTho Studio"
            )
        },
        {
            "subject": "Reminder: Outstanding balance of {amount} - {client_name}",
            "body": (
                "Dear {client_name},\n\n"
                "This is a gentle reminder that invoice {invoice_id} ({amount}) is currently {days_overdue} days past due.\n\n"
                "Please let us know if there are any details your finance department requires to release the payment this week.\n\n"
                "Thank you,\nWhenTho Billing"
            )
        }
    ],

    # 3. Approaching Maturity (Pre-Due Date / Gentle Nudge)
    "nudge_pre_due": [
        {
            "subject": "Friendly check-in: Invoice for {amount} due in {days_left} days",
            "body": (
                "Hi {client_name},\n\n"
                "Just sharing a quick courtesy reminder regarding our recent invoice of {amount}, due on {due_date} (in {days_left} days).\n\n"
                "Please confirm your finance team has everything needed for smooth processing.\n\n"
                "Thanks again for your partnership!\n\n"
                "Best,\nWhenTho Studio"
            )
        },
        {
            "subject": "Upcoming Payment: Invoice {amount} - {client_name}",
            "body": (
                "Hi {client_name},\n\n"
                "Hope all is well. As our agreed Net-{terms} cycle approaches its due date in {days_left} days, "
                "we wanted to make sure invoice {invoice_id} for {amount} is approved and on track.\n\n"
                "Let us know if you need any vendor forms or bank verification details.\n\n"
                "Warm regards,\nWhenTho Studio"
            )
        },
        {
            "subject": "Payment schedule check: Invoice {invoice_id} ({amount})",
            "body": (
                "Hi {client_name},\n\n"
                "Quick note to check if invoice {invoice_id} ({amount}) has cleared your internal review cycle ahead of its due date.\n\n"
                "Thank you for your ongoing collaboration!\n\n"
                "Best,\nWhenTho Accounts"
            )
        }
    ],

    # 4. Habitual Late / High Risk Payer
    "high_risk_habitual": [
        {
            "subject": "Expedited Clearance Request: Invoice {amount} ({client_name})",
            "body": (
                "Hi {client_name},\n\n"
                "We are writing to coordinate payment clearance for invoice {invoice_id} ({amount}).\n\n"
                "Given our project timelines and milestone requirements, we kindly request your support in expediting this settlement. "
                "Please let us know when we can expect the wire release this week.\n\n"
                "Best regards,\nWhenTho Accounts"
            )
        },
        {
            "subject": "Milestone Billing Coordination - {amount} - {client_name}",
            "body": (
                "Dear {client_name},\n\n"
                "Reaching out to verify the payment status of {amount} for completed milestone deliverables.\n\n"
                "To keep our upcoming project schedules aligned, we would appreciate confirmation of the disbursement date.\n\n"
                "Sincerely,\nWhenTho Delivery & Finance"
            )
        }
    ],

    # 5. Large Invoice Anomaly (>1.5x average)
    "large_amount_anomaly": [
        {
            "subject": "Executive Verification: Invoice {amount} for {client_name}",
            "body": (
                "Hi {client_name},\n\n"
                "Following up on our invoice of {amount} covering major project deliverables.\n\n"
                "We understand larger disbursements often require senior approval workflows. Please let us know if your procurement "
                "or finance directors need any additional signed sign-offs or documentation from our side to fast-track clearance.\n\n"
                "Best regards,\nWhenTho Operations"
            )
        }
    ]
}

def get_template_email(invoice_data, prediction_result):
    """
    Instantly selects the optimal pre-engineered recovery template (0ms latency).
    """
    raw_amount = invoice_data.get("invoice_amount", 0.0)
    try:
        formatted_amount = f"₹{float(raw_amount):,.2f}"
    except Exception:
        formatted_amount = str(raw_amount)

    client_name = invoice_data.get("client_name", invoice_data.get("client_id", "Client"))
    invoice_id = invoice_data.get("invoice_id", "INV")
    terms = int(invoice_data.get("payment_terms_days", 30))
    days_sent = int(invoice_data.get("days_since_invoice_sent", 0))
    days_overdue = max(0, days_sent - terms)
    days_left = max(1, terms - days_sent)
    amount_vs_avg = float(invoice_data.get("amount_vs_client_avg", 1.0))
    late_rate = float(invoice_data.get("client_late_payment_rate", 0.2))
    rec_action = prediction_result.get("recommended_action", "nudge")

    # Determine recovery category
    if days_overdue > 15:
        pool = RECOVERY_TEMPLATES["escalate_severe"]
    elif days_overdue > 0:
        pool = RECOVERY_TEMPLATES["escalate_moderate"]
    elif amount_vs_avg > 1.8:
        pool = RECOVERY_TEMPLATES["large_amount_anomaly"]
    elif late_rate >= 0.5:
        pool = RECOVERY_TEMPLATES["high_risk_habitual"]
    else:
        pool = RECOVERY_TEMPLATES["nudge_pre_due"]

    chosen = random.choice(pool)
    subject = chosen["subject"].format(
        amount=formatted_amount,
        client_name=client_name,
        invoice_id=invoice_id,
        days_overdue=days_overdue,
        days_left=days_left,
        terms=terms
    )
    body = chosen["body"].format(
        amount=formatted_amount,
        client_name=client_name,
        invoice_id=invoice_id,
        days_overdue=days_overdue,
        days_left=days_left,
        terms=terms,
        due_date="in the coming days"
    )

    return {
        "email_subject": subject,
        "email_body": body,
        "tone": rec_action,
        "source": "instant_template"
    }

def generate_followup_email(invoice_data, prediction_result, use_instant_templates=False):
    """
    Live AI follow-up communication orchestrator:
    1. If GEMINI_API_KEY is configured, calls Google Gemini API (gemini-flash-latest / gemini-2.5-flash)
       with full financial context, tone calibration, and causal attribution.
    2. Gracefully falls back to instantaneous deterministic recovery templates if network/API fails.
    """
    api_key = os.getenv("GEMINI_API_KEY")

    if not use_instant_templates and api_key and not api_key.startswith("your_"):
        client_name = invoice_data.get("client_name") or invoice_data.get("client_id", "Client")
        amount = invoice_data.get("invoice_amount", 0)
        formatted_amount = f"₹{amount:,.2f}"
        invoice_id = invoice_data.get("invoice_id", "INV-XXXX")
        terms = invoice_data.get("payment_terms_days", 30)
        days_sent = invoice_data.get("days_since_invoice_sent", 0)
        days_overdue = max(0, days_sent - terms)
        rec_action = prediction_result.get("recommended_action", "nudge")
        reason = prediction_result.get("plain_english_reason", "")

        tone_instruction = {
            "escalate": "Firm, urgent, and assertive tone. Emphasize that the account is past due and require immediate wire transfer or payment schedule.",
            "nudge": "Polite, professional, collaborative tone. Check in whether invoice was received by accounts payable and offer assistance.",
            "wait": "Courteous milestone courtesy note. Acknowledge ongoing engagement and remind of approaching settlement window."
        }.get(rec_action, "Professional and courteous tone.")

        prompt = (
            f"You are the billing communications orchestrator for WhenTho, an AI invoice intelligence system.\n"
            f"Generate a professional follow-up email with Subject and Body.\n"
            f"Client: {client_name}\n"
            f"Invoice ID: {invoice_id}\n"
            f"Amount: {formatted_amount}\n"
            f"Payment Terms: {terms} days\n"
            f"Days Elapsed: {days_sent} days ({days_overdue} days overdue)\n"
            f"Causal Behavioral Context: {reason}\n"
            f"Target Tone: {tone_instruction}\n\n"
            f"Rules:\n"
            f"1. Start with 'Subject: <subject line>'\n"
            f"2. Follow with the email body\n"
            f"3. Sign off as 'Accounts Receivable Team'\n"
            f"4. Do NOT include placeholders like [Your Name] or [Link]; state facts directly."
        )

        for model_name in ["gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                resp = requests.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=4
                )
                if resp.status_code == 200:
                    candidates = resp.json().get("candidates", [])
                    if candidates:
                        raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
                        lines = raw_text.split("\n")
                        subject = f"Payment Update: {invoice_id} ({client_name})"
                        body_lines = []
                        for idx, line in enumerate(lines):
                            if line.lower().startswith("subject:"):
                                subject = line.split(":", 1)[1].strip()
                            else:
                                body_lines.append(line)
                        body = "\n".join(body_lines).strip()
                        return {
                            "email_subject": subject,
                            "email_body": body,
                            "tone": rec_action,
                            "source": f"gemini_{model_name}"
                        }
            except Exception:
                continue

    # Deterministic high-speed template fallback
    return get_template_email(invoice_data, prediction_result)

