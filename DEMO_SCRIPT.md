# 🎬 WhenTho — Hackathon Demo Video Script (2.5 – 3 Minutes)

> **Target Duration:** 2:30 – 3:00 minutes  
> **Audience:** Razorpay AI Buildathon Judges & Technical Reviewers  
> **Live Demo URL:** https://whentho-tawny.vercel.app  
> **Tone:** Confident, problem-focused, technically credible, and fast-paced.

---

## ⏱️ Timeline Breakdown

| Time | Scene | On-Screen Action | Script / Voiceover |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:25** | **1. The Pain Point** | Show standard invoicing apps / spreadsheet / unpaid invoices. | *"Every freelancer, agency, and SMB knows this feeling: you finish the work, send the invoice, and then ask yourself the same question every single day — **When tho?** Invoicing tools today are passive archives. They record that an invoice was sent, and they wait. They don't protect your cash flow, and they don't help you collect."* |
| **0:25 - 0:50** | **2. Introducing WhenTho** | Cut to the live WhenTho dashboard at `whentho-tawny.vercel.app`. Scroll through the KPI cards and the live active invoices. | *"Meet **WhenTho** — an autonomous AI receivables and cash flow recovery engine built natively for Razorpay. Instead of treating invoices like static PDFs, WhenTho runs predictive machine learning to forecast **when** you'll get paid, calculates dynamic settlement survival curves, and automates payment recovery before an invoice even becomes critical."* |
| **0:50 - 1:25** | **3. The AI Engine & Risk Projection** | Click into an invoice with High or Medium risk (e.g. `INV-10026` or `INV-10025`). Highlight the Risk Badge, Causal Attribution, and the animated 30-Day Projection curve. | *"Let’s look at an active invoice. Powered by a LightGBM classifier with **0.88+ weighted F1 accuracy**, WhenTho doesn't just give you a generic score. It delivers: 1) **Causal Behavioral Attribution** — explaining why this client is flagged based on payment history, Net-30 term breaches, or unusual contract amounts; 2) **Time-To-Event Survival Curves** — showing the exact likelihood of settlement across 3, 7, 14, and 30 days; and 3) Our **Dynamic 30-Day Risk Projection** — running the model forward in time so you can see the inflection point where healthy receivables degrade into default."* |
| **1:25 - 1:55** | **4. Razorpay Recovery & Smart Actions** | Scroll down to the Action Center on the invoice detail page. Show the AI Follow-Up Email draft (Gemini 2.5 Flash), Hinglish Phone Call script, and the Razorpay Payment Link + UPI QR. | *"When an invoice is at risk, WhenTho takes immediate action: Using **Gemini 2.5 Flash**, it automatically drafts context-aware escalation emails calibrated to the client's past reliability. For Indian SMBs, it even generates a natural **Hinglish phone recovery script** for your collections team. Most importantly, every communication embeds an instant **Razorpay Smart Payment Link** and UPI QR code so the client can settle with one click."* |
| **1:55 - 2:25** | **5. Instant Checkout & Online Learning Loop** | Click the **"Simulate Razorpay FastCheckout Payment"** button or checkout modal. Show the invoice instantly changing to **PAID**, and show the Model Accuracy / Continuous Learning badge update. | *"Watch this in action: when the client pays via Razorpay UPI or Netbanking, our backend webhook listener intercepts the event in real-time. It reconciles the invoice, logs the predicted versus actual settlement duration, and continuously calibrates the model. Every single settled invoice feeds our online learning trajectory, making the predictions sharper with zero manual data entry."* |
| **2:25 - 2:45** | **6. Closing & Tech Stack** | Zoom out to show the full dashboard, then switch to the slide/repo showing the architecture (FastAPI on Render, React/Vite on Vercel, Razorpay API, LightGBM, Gemini). | *"WhenTho is fully production deployed — FastAPI on Render, modern React frontend on Vercel, and connected to real Razorpay payment rails. We’re transforming unpaid invoices from an anxiety into predictable, automated cash flow. Thank you!"* |

---

## 💡 Pro-Tips for Recording the Demo:

1. **Browser Setup:**
   - Open [whentho-tawny.vercel.app](https://whentho-tawny.vercel.app) in Google Chrome in full-screen.
   - Press `Cmd + Shift + B` to hide the bookmarks bar for a distraction-free window.
2. **Smooth Cursor Movements:**
   - Hover over the **30-Day Risk Projection** curve to show the interactive tooltip and milestone indicators.
   - Show the smooth swipe-right gesture or back navigation.
3. **Recording Software:**
   - **Loom** (super fast, embeds your facecam in the corner with automatic link sharing).
   - **QuickTime / Mac Screen Recording** (`Cmd + Shift + 5`).
