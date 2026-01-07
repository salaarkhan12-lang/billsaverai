"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function PricingPage() {
    const tiers = [
        {
            name: "Starter",
            price: "Free",
            description: "Perfect for individual practitioners trying out BillSaver.",
            features: [
                "Analyzes up to 10 documents/month",
                "Basic compliance checks",
                "Standard support",
                "Export to PDF"
            ],
            cta: "Get Started",
            href: "/dashboard",
            featured: false
        },
        {
            name: "Professional",
            price: "$49",
            period: "/month",
            description: "Ideal for small clinics requiring regular audits.",
            features: [
                "Analyzes up to 500 documents/month",
                "Advanced revenue optimization",
                "Priority email support",
                "Batch processing",
                "Export to PDF & CSV"
            ],
            cta: "Start Free Trial",
            href: "/dashboard",
            featured: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "For large hospitals and billing companies.",
            features: [
                "Unlimited document analysis",
                "Custom integration support",
                "Dedicated account manager",
                "SLA & Advanced Security",
                "On-premise deployment options"
            ],
            cta: "Contact Sales",
            href: "/contact",
            featured: false
        }
    ];

    return (
        <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                    >
                        Simple, Transparent Pricing
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-6 text-lg leading-8 text-gray-400"
                    >
                        Choose the plan that best fits your practice. No hidden fees.
                    </motion.p>
                </div>
                <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-none lg:grid-cols-3">
                    {tiers.map((tier, tierIdx) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + tierIdx * 0.1 }}
                            className={`flex flex-col justify-between rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 xl:p-10 ${tier.featured ? 'bg-blue-600/10 ring-blue-500 scale-105 z-10' : ''
                                } ${tierIdx === 0 ? 'lg:rounded-r-none' : ''} ${tierIdx === tiers.length - 1 ? 'lg:rounded-l-none' : ''
                                }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-x-4">
                                    <h3 className="text-lg font-semibold leading-8 text-white">
                                        {tier.name}
                                    </h3>
                                    {tier.featured && (
                                        <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-400">
                                            Most Popular
                                        </span>
                                    )}
                                </div>
                                <p className="mt-4 text-sm leading-6 text-gray-400">
                                    {tier.description}
                                </p>
                                <p className="mt-6 flex items-baseline gap-x-1">
                                    <span className="text-4xl font-bold tracking-tight text-white">{tier.price}</span>
                                    {tier.period && (
                                        <span className="text-sm font-semibold leading-6 text-gray-400">{tier.period}</span>
                                    )}
                                </p>
                                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex gap-x-3">
                                            <svg className="h-6 w-5 flex-none text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Link
                                href={tier.href}
                                className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tier.featured
                                        ? 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600 shadow-lg shadow-blue-500/20'
                                        : 'bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white'
                                    }`}
                            >
                                {tier.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
