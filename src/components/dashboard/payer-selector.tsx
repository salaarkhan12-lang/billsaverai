/**
 * Payer Selector Component
 * 
 * Dropdown select component for choosing commercial insurance payer.
 * Updates analysis to use payer-specific CPT rates.
 */

'use client';

import { PAYER_FEE_SCHEDULES } from '@/lib/payer-fee-schedules';

export interface PayerSelectorProps {
    selectedPayer: string;
    onPayerChange: (payerId: string) => void;
    className?: string;
    disabled?: boolean;
}

export function PayerSelector({
    selectedPayer,
    onPayerChange,
    className = '',
    disabled = false,
}: PayerSelectorProps) {
    // Get national payers (exclude regional for initial release)
    const nationalPayers = Object.entries(PAYER_FEE_SCHEDULES)
        .filter(([_, schedule]) => schedule.locality === 'National Average')
        .sort((a, b) => {
            // Sort: BCBS first, UHC second, then alphabetical
            if (a[0] === 'bcbs-national') return -1;
            if (b[0] === 'bcbs-national') return 1;
            if (a[0] === 'uhc-national') return -1;
            if (b[0] === 'uhc-national') return 1;
            return a[1].payerName.localeCompare(b[1].payerName);
        });

    return (
        <div className={`payer-selector-container ${className}`}>
            <label
                htmlFor="payer-select"
                className="block text-sm font-medium text-gray-300 mb-2"
            >
                <span className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                    </svg>
                    Insurance Payer
                </span>
            </label>

            <select
                id="payer-select"
                value={selectedPayer}
                onChange={(e) => onPayerChange(e.target.value)}
                disabled={disabled}
                className={`
          w-full px-4 py-3
          bg-gray-800 border-2 border-gray-700
          rounded-lg
          text-white text-base
          focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50
          transition-all duration-200
          cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:border-gray-600
          appearance-none
          bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%206l5%205%205-5%202%201-7%207-7-7%202-1z%22%20fill%3D%22%239CA3AF%22%2F%3E%3C%2Fsvg%3E')]
          bg-[length:16px_16px]
          bg-[position:right_12px_center]
          bg-no-repeat
          pr-10
        `}
            >
                {nationalPayers.map(([payerId, schedule]) => (
                    <option key={payerId} value={payerId}>
                        {schedule.payerShortName} - {(schedule.rateMultiplier * 100).toFixed(0)}% of Medicare
                    </option>
                ))}
            </select>

            {/* Helper text */}
            <p className="mt-2 text-xs text-gray-400">
                Revenue calculations use {PAYER_FEE_SCHEDULES[selectedPayer]?.payerShortName || 'selected'} rates
                ({((PAYER_FEE_SCHEDULES[selectedPayer]?.rateMultiplier || 1.25) * 100).toFixed(0)}% of Medicare baseline)
            </p>
        </div>
    );
}

/**
 * Compact Payer Selector (for inline use)
 * Smaller version for toolbars or header areas
 */
export function CompactPayerSelector({
    selectedPayer,
    onPayerChange,
    disabled = false,
}: Omit<PayerSelectorProps, 'className'>) {
    const nationalPayers = Object.entries(PAYER_FEE_SCHEDULES)
        .filter(([_, schedule]) => schedule.locality === 'National Average')
        .sort((a, b) => {
            if (a[0] === 'bcbs-national') return -1;
            if (b[0] === 'bcbs-national') return 1;
            return a[1].payerShortName.localeCompare(b[1].payerShortName);
        });

    return (
        <div className="inline-flex items-center gap-2">
            <label htmlFor="payer-select-compact" className="text-sm text-gray-400 whitespace-nowrap">
                Payer:
            </label>
            <select
                id="payer-select-compact"
                value={selectedPayer}
                onChange={(e) => onPayerChange(e.target.value)}
                disabled={disabled}
                className="
          px-3 py-1.5
          bg-gray-800 border border-gray-700
          rounded-md
          text-white text-sm
          focus:outline-none focus:border-blue-500
          cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
        "
            >
                {nationalPayers.map(([payerId, schedule]) => (
                    <option key={payerId} value={payerId}>
                        {schedule.payerShortName}
                    </option>
                ))}
            </select>
        </div>
    );
}
