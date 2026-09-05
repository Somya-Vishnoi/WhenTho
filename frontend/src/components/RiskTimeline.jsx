import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { fetchRiskProjection } from '../api/client';

export default function RiskTimeline({ invoiceId, invoice }) {
  const [projection, setProjection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProjection() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchRiskProjection(invoiceId);
        if (isMounted) {
          setProjection(data || []);
        }
      } catch (err) {
        console.error('Failed to load risk projection:', err);
        if (isMounted) {
          setError('Failed to compute forward risk projection.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (invoiceId) {
      loadProjection();
    }
    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

  // Invoice parameters
  const paymentTermsDays = invoice?.payment_terms_days || 30;
  const daysSinceSent = invoice?.days_since_invoice_sent || 0;
  const isAlreadyOverdue = daysSinceSent > paymentTermsDays;
  const daysUntilDue = paymentTermsDays - daysSinceSent; // If > 0, future day offset when due

  // Chart dimensions & coordinates
  const svgWidth = 760;
  const svgHeight = 220;
  const paddingLeft = 46;
  const paddingRight = 36;
  const paddingTop = 26;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Compute points and SVG path
  const points = useMemo(() => {
    if (!projection || projection.length === 0) return [];
    return projection.map((item, idx) => {
      const x = paddingLeft + (idx / 30) * chartWidth;
      // Confidence: 0.0 to 1.0 (inverted for SVG y: 1.0 at top, 0.0 at bottom)
      const conf = Math.max(0, Math.min(1, item.confidence || 0));
      const y = paddingTop + (1 - conf) * chartHeight;
      return {
        ...item,
        x,
        y
      };
    });
  }, [projection, chartWidth, chartHeight]);

  // Generate cubic bezier smooth SVG path
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = ((current.x + next.x) / 2).toFixed(1);
      d += ` C ${controlX} ${current.y.toFixed(1)}, ${controlX} ${next.y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
    }
    return d;
  }, [points]);

  // Area fill under path
  const areaD = useMemo(() => {
    if (!pathD || points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    const baseY = (paddingTop + chartHeight).toFixed(1);
    return `${pathD} L ${last.x.toFixed(1)} ${baseY} L ${first.x.toFixed(1)} ${baseY} Z`;
  }, [pathD, points, paddingTop, chartHeight]);

  // Key Milestones Computation
  const milestones = useMemo(() => {
    if (!projection || projection.length === 0) return null;

    // 1. Due Date Card
    let dueDateCard = null;
    if (isAlreadyOverdue) {
      const overdueDays = daysSinceSent - paymentTermsDays;
      dueDateCard = {
        title: "Already Overdue",
        dayNum: `+${overdueDays}d overdue`,
        dateText: `${overdueDays} days past terms`,
        status: "Overdue",
        risk: "high",
        desc: `Exceeded Net ${paymentTermsDays} terms`
      };
    } else {
      const dueDayOffset = Math.max(0, Math.min(30, daysUntilDue));
      const dueData = projection[dueDayOffset] || projection[0];
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dueDayOffset);
      const dateString = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      dueDateCard = {
        title: "Due Date Milestone",
        dayNum: `Day ${dueDayOffset}`,
        dateText: dateString,
        status: dueData.predicted_status,
        risk: dueData.risk_level,
        desc: `Net ${paymentTermsDays} deadline`
      };
    }

    // 2. Risk Escalates Milestone (low -> medium OR medium -> high)
    let riskFlipDay = null;
    let initialRisk = projection[0]?.risk_level || 'low';
    for (let i = 1; i < projection.length; i++) {
      const item = projection[i];
      if (initialRisk === 'low' && (item.risk_level === 'medium' || item.risk_level === 'high')) {
        riskFlipDay = item;
        break;
      }
      if (initialRisk === 'medium' && item.risk_level === 'high') {
        riskFlipDay = item;
        break;
      }
    }

    let escalateRiskCard = null;
    if (riskFlipDay) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + riskFlipDay.day);
      escalateRiskCard = {
        title: "Risk Shifts Higher",
        dayNum: `Day ${riskFlipDay.day}`,
        dateText: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: riskFlipDay.predicted_status,
        risk: riskFlipDay.risk_level,
        desc: `Confidence drops past threshold`
      };
    } else {
      escalateRiskCard = {
        title: "Risk Stability",
        dayNum: isAlreadyOverdue ? "Constant" : "Steady",
        dateText: "Throughout 30d",
        status: projection[0]?.predicted_status || "on_time",
        risk: projection[0]?.risk_level || "low",
        desc: isAlreadyOverdue ? "Critical risk plateau" : "Stable payment velocity"
      };
    }

    // 3. Action Needed ("escalate")
    let actionFlipDay = null;
    for (let i = 0; i < projection.length; i++) {
      if (projection[i].recommended_action === 'escalate') {
        actionFlipDay = projection[i];
        break;
      }
    }

    let actionNeededCard = null;
    if (actionFlipDay) {
      const isPast = actionFlipDay.day === 0 && isAlreadyOverdue;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + actionFlipDay.day);
      actionNeededCard = {
        title: "Action Demanded",
        dayNum: isPast ? "Active Now" : `Day ${actionFlipDay.day}`,
        dateText: isPast ? "Past due point" : targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: "Escalate",
        risk: "high",
        desc: isPast ? "Immediate formal dunning" : "Automated demand triggered"
      };
    } else {
      actionNeededCard = {
        title: "Action Demanded",
        dayNum: "Day +15",
        dateText: "Soft Nudge",
        status: "Nudge",
        risk: "medium",
        desc: "Autonomous courtesy reminder"
      };
    }

    return {
      dueCard: dueDateCard,
      riskCard: escalateRiskCard,
      actionCard: actionNeededCard
    };
  }, [projection, isAlreadyOverdue, daysSinceSent, paymentTermsDays, daysUntilDue]);

  // Helper to format date for day point
  const getDayDateString = (dayOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Due Date X position
  const dueDateX = useMemo(() => {
    if (isAlreadyOverdue) return null;
    if (daysUntilDue < 0 || daysUntilDue > 30) return null;
    return paddingLeft + (daysUntilDue / 30) * chartWidth;
  }, [isAlreadyOverdue, daysUntilDue, chartWidth]);

  return (
    <div className="space-y-4">
      {/* Muted section header as requested */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#888888] tracking-normal font-normal">
          What happens if this stays unpaid?
        </p>
        <div className="flex items-center gap-3 text-[11px] text-[#71717a]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
            <span>Low Risk</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
            <span>Medium Risk</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
            <span>High Risk</span>
          </span>
        </div>
      </div>

      {/* Main Timeline Card */}
      <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 shadow-sm relative">
        {loading ? (
          /* Animated Skeleton Loading state - no spinners */
          <div className="space-y-4 py-2">
            <div className="h-4 w-48 bg-[#f4f4f5] rounded animate-pulse" />
            <div className="h-48 w-full bg-gradient-to-r from-[#f4f4f5] via-[#e4e4e7] to-[#f4f4f5] rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="h-20 bg-[#f4f4f5] rounded-lg animate-pulse" />
              <div className="h-20 bg-[#f4f4f5] rounded-lg animate-pulse" />
              <div className="h-20 bg-[#f4f4f5] rounded-lg animate-pulse" />
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline Title & Model Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f4f4f5] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-50 text-blue-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#09090b] tracking-tight">
                  30-Day Forward Risk Trajectory Simulator
                </span>
                <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  31 Inference Passes
                </span>
              </div>
              <div className="text-[11px] text-[#71717a] flex items-center gap-1.5">
                <span>Model v4.2 LightGBM</span>
                <span>•</span>
                <span className="font-mono">Time-Decay Recalibrated</span>
              </div>
            </div>

            {/* SVG Interactive Chart with Horizontal Scroll Container on Mobile */}
            <div className="overflow-x-auto pb-2 relative">
              <div className="min-w-[680px] sm:min-w-full relative">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto overflow-visible select-none"
                >
                  <defs>
                    {/* Linear Gradient for the dynamic risk line */}
                    <linearGradient id="riskLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      {points.map((p, idx) => {
                        const pct = (idx / (points.length - 1)) * 100;
                        const color =
                          p.risk_level === 'high'
                            ? '#ef4444'
                            : p.risk_level === 'medium'
                            ? '#eab308'
                            : '#22c55e';
                        return <stop key={idx} offset={`${pct.toFixed(1)}%`} stopColor={color} />;
                      })}
                    </linearGradient>

                    {/* Area fill gradient */}
                    <linearGradient id="riskAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Subtle Overdue Zone Pattern */}
                    <pattern id="overdueHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.15" />
                    </pattern>
                  </defs>

                  {/* Shaded Overdue Zone if due date falls within 0..30 days */}
                  {dueDateX !== null && (
                    <rect
                      x={dueDateX}
                      y={paddingTop}
                      width={svgWidth - paddingRight - dueDateX}
                      height={chartHeight}
                      fill="#ef444415"
                      className="transition-all"
                    />
                  )}

                  {/* Horizontal Grid lines & Y-Axis Confidence labels */}
                  {[1.0, 0.75, 0.5, 0.25, 0.0].map((level, i) => {
                    const y = paddingTop + (1 - level) * chartHeight;
                    return (
                      <g key={i} className="text-[#a1a1aa] font-mono text-[10px]">
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={svgWidth - paddingRight}
                          y2={y}
                          stroke="#f4f4f5"
                          strokeDasharray={level === 0 || level === 1.0 ? "none" : "3 3"}
                          strokeWidth="1"
                        />
                        <text
                          x={paddingLeft - 8}
                          y={y + 3}
                          textAnchor="end"
                          fill="#a1a1aa"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {Math.round(level * 100)}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Guide: Due Date Marker */}
                  {dueDateX !== null && (
                    <g>
                      <line
                        x1={dueDateX}
                        y1={paddingTop}
                        x2={dueDateX}
                        y2={paddingTop + chartHeight}
                        stroke="#f59e0b"
                        strokeDasharray="4 3"
                        strokeWidth="1.5"
                      />
                      {/* Due Date Label Pin */}
                      <rect
                        x={dueDateX - 28}
                        y={paddingTop - 18}
                        width="56"
                        height="16"
                        rx="4"
                        fill="#fef3c7"
                        stroke="#fde68a"
                        strokeWidth="1"
                      />
                      <text
                        x={dueDateX}
                        y={paddingTop - 7}
                        textAnchor="middle"
                        fill="#92400e"
                        fontSize="9"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        DUE DATE
                      </text>
                    </g>
                  )}

                  {/* Overdue Banner if already overdue from Day 0 */}
                  {isAlreadyOverdue && (
                    <g>
                      <rect
                        x={paddingLeft}
                        y={paddingTop}
                        width={chartWidth}
                        height={chartHeight}
                        fill="#ef44440c"
                      />
                      <text
                        x={paddingLeft + chartWidth - 10}
                        y={paddingTop + 16}
                        textAnchor="end"
                        fill="#dc2626"
                        fontSize="10"
                        fontWeight="700"
                        letterSpacing="0.05em"
                        fontFamily="sans-serif"
                        opacity="0.6"
                      >
                        CRITICAL OVERDUE DELINQUENCY ZONE
                      </text>
                    </g>
                  )}

                  {/* Filled area below curve */}
                  {areaD && (
                    <path
                      d={areaD}
                      fill="url(#riskAreaGradient)"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Smooth Risk Line with Pure CSS stroke-dasharray animation */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="url(#riskLineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 2000,
                        strokeDashoffset: 2000,
                        animation: 'drawRiskPath 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                      }}
                    />
                  )}

                  {/* Day 0 "Today" Pulsing Beacon Marker */}
                  {points[0] && (
                    <g className="pointer-events-none">
                      <circle
                        cx={points[0].x}
                        cy={points[0].y}
                        r="9"
                        fill="#3b82f6"
                        className="animate-ping opacity-50"
                      />
                      <circle
                        cx={points[0].x}
                        cy={points[0].y}
                        r="5"
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      {/* Today Tag */}
                      <rect
                        x={points[0].x - 18}
                        y={points[0].y - 24}
                        width="36"
                        height="15"
                        rx="3"
                        fill="#18181b"
                      />
                      <text
                        x={points[0].x}
                        y={points[0].y - 14}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8.5"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        TODAY
                      </text>
                    </g>
                  )}

                  {/* X-Axis Day Labels: Day 0, Day 5, Day 10... Day 30 */}
                  {[0, 5, 10, 15, 20, 25, 30].map((d) => {
                    const x = paddingLeft + (d / 30) * chartWidth;
                    const dateText = getDayDateString(d);
                    return (
                      <g key={d} className="fade-in-labels" style={{ animation: 'fadeInLabels 0.5s ease 1s forwards', opacity: 0 }}>
                        <line
                          x1={x}
                          y1={paddingTop + chartHeight}
                          x2={x}
                          y2={paddingTop + chartHeight + 4}
                          stroke="#cbd5e1"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={paddingTop + chartHeight + 16}
                          textAnchor="middle"
                          fill="#71717a"
                          fontSize="9.5"
                          fontWeight="600"
                          fontFamily="sans-serif"
                        >
                          {d === 0 ? "Today" : `+${d}d`}
                        </text>
                        <text
                          x={x}
                          y={paddingTop + chartHeight + 28}
                          textAnchor="middle"
                          fill="#a1a1aa"
                          fontSize="8.5"
                          fontFamily="monospace"
                        >
                          {dateText}
                        </text>
                      </g>
                    );
                  })}

                  {/* Interactive invisible hover targets for every day (0 to 30) */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="14"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* Highlight Dot when active or hovered */}
                      {hoveredPoint?.day === p.day && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="6"
                          fill={
                            p.risk_level === 'high'
                              ? '#ef4444'
                              : p.risk_level === 'medium'
                              ? '#eab308'
                              : '#22c55e'
                          }
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          className="pointer-events-none"
                        />
                      )}
                    </g>
                  ))}
                </svg>

                {/* Floating Interactive Tooltip Card with Smart Bounds Positioning */}
                {hoveredPoint && (() => {
                  const leftPercent = Math.min(84, Math.max(16, (hoveredPoint.x / svgWidth) * 100));
                  const isTopHalf = hoveredPoint.y < 90;
                  return (
                    <div
                      className={`absolute z-30 pointer-events-none transform -translate-x-1/2 ${
                        isTopHalf ? 'translate-y-4 mt-2' : '-translate-y-full mb-3'
                      } bg-[#18181b] text-white p-3 rounded-lg shadow-2xl border border-[#27272a] text-xs space-y-1.5 transition-all duration-75 w-56 sm:w-60`}
                      style={{
                        left: `${leftPercent}%`,
                        top: `${(hoveredPoint.y / svgHeight) * 100}%`
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-[#27272a] pb-1">
                        <span className="font-bold text-white text-[11px] truncate">
                          Day {hoveredPoint.day} — {getDayDateString(hoveredPoint.day)}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                            hoveredPoint.risk_level === 'high'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : hoveredPoint.risk_level === 'medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {hoveredPoint.risk_level} risk
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 text-[11px] pt-0.5">
                        <div>
                          <span className="text-[#a1a1aa] block text-[10px]">Predicted:</span>
                          <span className="font-semibold capitalize text-white truncate block">
                            {hoveredPoint.predicted_status.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#a1a1aa] block text-[10px]">Confidence:</span>
                          <span className="font-mono font-bold text-blue-400">
                            {Math.round(hoveredPoint.confidence * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-[#27272a] text-[11px] flex items-center justify-between gap-2">
                        <span className="text-[#a1a1aa] text-[10px]">Action:</span>
                        <span
                          className={`font-semibold capitalize px-1.5 py-0.5 rounded text-[10px] ${
                            hoveredPoint.recommended_action === 'escalate'
                              ? 'bg-rose-900/80 text-rose-200'
                              : hoveredPoint.recommended_action === 'nudge'
                              ? 'bg-amber-900/80 text-amber-200'
                              : 'bg-emerald-900/80 text-emerald-200'
                          }`}
                        >
                          {hoveredPoint.recommended_action}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* What Happens If They Don't Pay? Insight Strip */}
            {milestones && (
              <div className="space-y-2 pt-1 border-t border-[#f4f4f5]">
                <div className="flex items-center gap-1.5 text-xs text-[#71717a] font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Key Trajectory Milestones (Next 30 Days)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card 1: Due Date / Already Overdue */}
                  <div className="bg-[#fafafa] border border-[#e4e4e7] hover:border-slate-300 rounded-lg p-3.5 flex flex-col justify-between transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                        {milestones.dueCard.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          milestones.dueCard.risk === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : milestones.dueCard.risk === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {milestones.dueCard.risk} Risk
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="text-base font-extrabold text-[#09090b]">
                        {milestones.dueCard.dayNum}
                      </div>
                      <div className="text-xs text-[#71717a] font-medium">
                        {milestones.dueCard.dateText}
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-[#71717a] border-t border-[#e4e4e7] pt-1.5">
                      {milestones.dueCard.desc}
                    </div>
                  </div>

                  {/* Card 2: Risk Escalates */}
                  <div className="bg-[#fafafa] border border-[#e4e4e7] hover:border-slate-300 rounded-lg p-3.5 flex flex-col justify-between transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                        {milestones.riskCard.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          milestones.riskCard.risk === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : milestones.riskCard.risk === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {milestones.riskCard.risk} Risk
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="text-base font-extrabold text-[#09090b]">
                        {milestones.riskCard.dayNum}
                      </div>
                      <div className="text-xs text-[#71717a] font-medium">
                        {milestones.riskCard.dateText}
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-[#71717a] border-t border-[#e4e4e7] pt-1.5">
                      {milestones.riskCard.desc}
                    </div>
                  </div>

                  {/* Card 3: Action Needed */}
                  <div className="bg-[#fafafa] border border-[#e4e4e7] hover:border-slate-300 rounded-lg p-3.5 flex flex-col justify-between transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-[#71717a] tracking-wider">
                        {milestones.actionCard.title}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-rose-100 text-rose-700">
                        {milestones.actionCard.status}
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="text-base font-extrabold text-[#09090b]">
                        {milestones.actionCard.dayNum}
                      </div>
                      <div className="text-xs text-[#71717a] font-medium">
                        {milestones.actionCard.dateText}
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-[#71717a] border-t border-[#e4e4e7] pt-1.5">
                      {milestones.actionCard.desc}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global CSS for Stroke Draw Keyframe Animation */}
      <style>{`
        @keyframes drawRiskPath {
          0% {
            stroke-dashoffset: 2000;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeInLabels {
          0% {
            opacity: 0;
            transform: translateY(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
