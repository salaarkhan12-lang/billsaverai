"use client";

import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, Calendar, Users, Calculator } from "lucide-react";
import { GlassCard } from "../GlassCard";

/**
 * ROI Calculator Component
 * 
 * Interactive calculator that shows practice-specific revenue projections.
 * Critical for clinical manager demos - shows concrete dollar value.
 * 
 * Example scenario (3 cardiologists):
 * - 3 providers x 15 patients/day x 240 days = 10,800 visits/year
 * - 70% Medicare Advantage, 20% commercial, 10% Medicare
 * - 15% improvement rate = 1,620 upgraded visits
 * - Revenue gain: ~$60K/year
 * - Cost: ~$9K/year
 * - Net gain: ~$51K | ROI: ~570% | Breakeven: 2 months
 */

interface ROIInputs {
    numProviders: number;
    patientsPerDayPerProvider: number;
    workDaysPerYear: number;
    payerMix: {
        medicareAdvantage: number;  // %
        commercial: number;
        medicare: number;
    };
    currentAvgLevel: string;
    expectedImprovement: number;  // % of notes upgraded
    costPerProvider: number;      // Monthly subscription
}

export function ROICalculator() {
    const [inputs, setInputs] = useState<ROIInputs>({
        numProviders: 3,
        patientsPerDayPerProvider: 15,
        workDaysPerYear: 240,
        payerMix: {
            medicareAdvantage: 70,
            commercial: 20,
            medicare: 10,
        },
        currentAvgLevel: '99213',
        expectedImprovement: 15,
        costPerProvider: 249,
    });

    const calculations = useMemo(() => {
        const totalVisits = inputs.numProviders *
            inputs.patientsPerDayPerProvider *
            inputs.workDaysPerYear;

        const visitsByPayer = {
            ma: Math.round(totalVisits * inputs.payerMix.medicareAdvantage / 100),
            commercial: Math.round(totalVisits * inputs.payerMix.commercial / 100),
            medicare: Math.round(totalVisits * inputs.payerMix.medicare / 100),
        };

        // Revenue gain per E/M level upgrade (99213 → 99214)
        const perVisitGain = {
            ma: 38,        // Medicare Advantage ~$131 → $169
            commercial: 51, // Commercial ~$125 → $176 (1.35x multiplier)
            medicare: 38,   // Traditional Medicare
        };

        const upgradedVisits = {
            ma: Math.round(visitsByPayer.ma * (inputs.expectedImprovement / 100)),
            commercial: Math.round(visitsByPayer.commercial * (inputs.expectedImprovement / 100)),
            medicare: Math.round(visitsByPayer.medicare * (inputs.expectedImprovement / 100)),
        };

        const annualRevenue =
            (upgradedVisits.ma * perVisitGain.ma) +
            (upgradedVisits.commercial * perVisitGain.commercial) +
            (upgradedVisits.medicare * perVisitGain.medicare);

        const annualCost = inputs.numProviders * inputs.costPerProvider * 12;

        const netGain = annualRevenue - annualCost;
        const roi = annualCost > 0 ? Math.round((annualRevenue / annualCost - 1) * 100) : 0;
        const breakeven = annualRevenue > 0 ? Math.ceil(annualCost / (annualRevenue / 12)) : 0;

        return {
            totalVisits,
            visitsByPayer,
            upgradedVisits,
            annualRevenue: Math.round(annualRevenue),
            annualCost,
            netGain: Math.round(netGain),
            roi,
            breakeven: Math.min(breakeven, 12), // Cap at 12 months
        };
    }, [inputs]);

    const updateInput = (field: string, value: number) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const updatePayerMix = (payer: keyof ROIInputs['payerMix'], value: number) => {
        setInputs(prev => {
            const newPayerMix = { ...prev.payerMix, [payer]: value };
            // Ensure total doesn't exceed 100%
            const total = Object.values(newPayerMix).reduce((a, b) => a + b, 0);
            if (total > 100) {
                return prev; // Reject invalid update
            }
            return { ...prev, payerMix: newPayerMix };
        });
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <Calculator className="w-8 h-8 text-blue-600" />
                    <h2 className="text-3xl font-bold">BillSaver ROI Calculator</h2>
                </div>
                <p className="text-gray-600">
                    Calculate your practice's potential revenue gain with BillSaver
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <GlassCard className="p-6 space-y-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Practice Information
                    </h3>

                    <div className="space-y-4">
                        <InputField
                            label="Number of Providers"
                            value={inputs.numProviders}
                            onChange={(v) => updateInput('numProviders', v)}
                            min={1}
                            max={50}
                            step={1}
                        />

                        <InputField
                            label="Patients per Day (per provider)"
                            value={inputs.patientsPerDayPerProvider}
                            onChange={(v) => updateInput('patientsPerDayPerProvider', v)}
                            min={5}
                            max={40}
                            step={1}
                        />

                        <InputField
                            label="Work Days per Year"
                            value={inputs.workDaysPerYear}
                            onChange={(v) => updateInput('workDaysPerYear', v)}
                            min={200}
                            max={260}
                            step={5}
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-medium mb-3">Payer Mix (%)</h4>
                        <div className="space-y-3">
                            <InputField
                                label="Medicare Advantage"
                                value={inputs.payerMix.medicareAdvantage}
                                onChange={(v) => updatePayerMix('medicareAdvantage', v)}
                                min={0}
                                max={100}
                                step={5}
                                suffix="%"
                            />
                            <InputField
                                label="Commercial Insurance"
                                value={inputs.payerMix.commercial}
                                onChange={(v) => updatePayerMix('commercial', v)}
                                min={0}
                                max={100}
                                step={5}
                                suffix="%"
                            />
                            <InputField
                                label="Traditional Medicare"
                                value={inputs.payerMix.medicare}
                                onChange={(v) => updatePayerMix('medicare', v)}
                                min={0}
                                max={100}
                                step={5}
                                suffix="%"
                            />
                            <p className="text-xs text-gray-500">
                                Total: {Object.values(inputs.payerMix).reduce((a, b) => a + b, 0)}%
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <InputField
                            label="Expected Improvement Rate"
                            value={inputs.expectedImprovement}
                            onChange={(v) => updateInput('expectedImprovement', v)}
                            min={5}
                            max={40}
                            step={5}
                            suffix="%"
                            helpText="% of notes expected to upgrade by one E/M level"
                        />

                        <InputField
                            label="Cost per Provider (monthly)"
                            value={inputs.costPerProvider}
                            onChange={(v) => updateInput('costPerProvider', v)}
                            min={99}
                            max={499}
                            step={50}
                            prefix="$"
                        />
                    </div>
                </GlassCard>

                {/* Results Section */}
                <div className="space-y-4">
                    <ResultCard
                        icon={<DollarSign className="w-6 h-6" />}
                        label="Annual Revenue Gain"
                        value={`$${calculations.annualRevenue.toLocaleString()}`}
                        highlight
                        subtitle={`From ${calculations.upgradedVisits.ma + calculations.upgradedVisits.commercial + calculations.upgradedVisits.medicare} upgraded visits`}
                    />

                    <ResultCard
                        icon={<Calculator className="w-6 h-6" />}
                        label="Annual Cost"
                        value={`$${calculations.annualCost.toLocaleString()}`}
                        subtitle={`${inputs.numProviders} providers × $${inputs.costPerProvider}/month`}
                    />

                    <ResultCard
                        icon={<TrendingUp className="w-6 h-6" />}
                        label="Net Annual Gain"
                        value={`$${calculations.netGain.toLocaleString()}`}
                        highlight
                        valueColor="text-emerald-600"
                        subtitle="Revenue gain minus cost"
                    />

                    <ResultCard
                        icon={<TrendingUp className="w-6 h-6" />}
                        label="Return on Investment"
                        value={`${calculations.roi}%`}
                        highlight
                        valueColor="text-blue-600"
                        subtitle={calculations.roi > 100 ? "Strong ROI" : "Break even"}
                    />

                    <ResultCard
                        icon={<Calendar className="w-6 h-6" />}
                        label="Breakeven Timeline"
                        value={`${calculations.breakeven} month${calculations.breakeven !== 1 ? 's' : ''}`}
                        subtitle="Time to recover investment"
                    />

                    {/* Summary */}
                    <GlassCard className="p-4 bg-gradient-to-r from-blue-50 to-emerald-50">
                        <p className="text-sm text-gray-700">
                            <strong>Total Visits:</strong> {calculations.totalVisits.toLocaleString()}/year
                            <br />
                            <strong>Upgraded Visits:</strong> {(calculations.upgradedVisits.ma + calculations.upgradedVisits.commercial + calculations.upgradedVisits.medicare).toLocaleString()} ({inputs.expectedImprovement}%)
                        </p>
                    </GlassCard>

                    <div className="text-xs text-gray-500 space-y-1 pt-2">
                        <p><strong>Assumptions:</strong></p>
                        <p>• Average upgrade: One E/M level (99213 → 99214)</p>
                        <p>• Medicare Advantage: $38/visit gain</p>
                        <p>• Commercial: $51/visit gain (1.35x Medicare)</p>
                        <p>• Conservative {inputs.expectedImprovement}% improvement rate</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Components

function InputField({
    label,
    value,
    onChange,
    min,
    max,
    step,
    prefix,
    suffix,
    helpText
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    prefix?: string;
    suffix?: string;
    helpText?: string;
}) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <div className="flex items-center gap-2">
                {prefix && <span className="text-gray-600">{prefix}</span>}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex items-center min-w-[60px]">
                    <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    {suffix && <span className="ml-1 text-gray-600 text-sm">{suffix}</span>}
                </div>
            </div>
            {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
        </div>
    );
}

function ResultCard({
    icon,
    label,
    value,
    subtitle,
    highlight = false,
    valueColor = "text-gray-900"
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    subtitle?: string;
    highlight?: boolean;
    valueColor?: string;
}) {
    return (
        <GlassCard className={`p-4 ${highlight ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="flex items-start gap-3">
                <div className={`${highlight ? 'text-blue-600' : 'text-gray-600'}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
            </div>
        </GlassCard>
    );
}
