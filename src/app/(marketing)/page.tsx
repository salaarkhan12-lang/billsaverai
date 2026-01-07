"use client";

import Link from "next/link";
import { motion } from "framer-motion"; // Keeping motion for future enhancements or simple usage
import { ParticleField } from "@/components/ParticleField";

export default function LandingPage() {
    return (
        <div className="relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <ParticleField />
            </div>

            {/* Hero Section */}
            <section className="relative z-10 px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-32">
                <div className="text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
                    >
                        <span className="block">Optimize Medical Billing</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            Maximize Revenue
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="max-w-md mx-auto mt-3 text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
                    >
                        BillSaver uses advanced AI to analyze medical documentation, identifying missed billing opportunities and ensuring compliance with the latest coding standards.
                    </motion.p>
                    <div className="max-w-md mx-auto mt-5 sm:flex sm:justify-center md:mt-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="rounded-md shadow"
                        >
                            <Link
                                href="/dashboard"
                                className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all hover:scale-105"
                            >
                                Analyze Document
                            </Link>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3"
                        >
                            <Link
                                href="/pricing"
                                className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-blue-100 bg-white/10 border border-transparent rounded-md hover:bg-white/20 md:py-4 md:text-lg md:px-10 backdrop-blur-sm transition-all"
                            >
                                View Pricing
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Feature Section */}
            <section className="relative z-10 bg-black/30 backdrop-blur-md py-20">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                            Why Choose BillSaver?
                        </h2>
                    </div>
                    <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
                        {[
                            {
                                title: "AI-Powered Analysis",
                                description: "Our advanced algorithms scan documents for missed codes and compliance issues instantly.",
                                icon: "⚡"
                            },
                            {
                                title: "Revenue Optimization",
                                description: "Identify under-coded services and recover lost revenue potential with confidence.",
                                icon: "💰"
                            },
                            {
                                title: "Compliance & Security",
                                description: "Built with HIPAA compliance in mind, ensuring your data is always secure.",
                                icon: "shield"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <div className="text-4xl mb-4 text-blue-400">{feature.icon === 'shield' ? (
                                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                ) : feature.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
