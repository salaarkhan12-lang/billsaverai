export default function PrivacyPolicy() {
    return (
        <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-3xl px-6 lg:px-8 text-white">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-8">Privacy Policy & HIPAA Compliance</h1>
                <div className="prose prose-invert max-w-none">
                    <p className="lead text-gray-300 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mt-8 mb-8">
                        <p className="font-semibold text-blue-200">Executive Summary for Healthcare Providers:</p>
                        <ul className="list-disc pl-5 text-sm text-blue-300 mt-2 space-y-1">
                            <li><strong>Evaluation Mode:</strong> All data effectively remains on your device (Client-Side Only).</li>
                            <li><strong>Ephemeral Storage:</strong> Patient data is stored in volatile browser memory (SessionStorage) and is erased when you close the tab.</li>
                            <li><strong>No Cloud Persistence:</strong> In this demo version, no PHI is sent to or stored on BillSaver servers.</li>
                        </ul>
                    </div>

                    <h2 className="text-xl font-bold mt-8 mb-4">1. Protected Health Information (PHI)</h2>
                    <p className="text-gray-400 mb-4">
                        BillSaver is designed to process PHI in accordance with the Health Insurance Portability and Accountability Act (HIPAA).
                        In the current Evaluation Mode, the application operates as a <strong>Zero-Knowledge Client</strong>.
                        The analysis algorithms run locally within your browser instance.
                        We do not retain, transmit, or view the contents of the medical documentation you upload.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4">2. Data Security & Encryption</h2>
                    <p className="text-gray-400 mb-4">
                        Any temporary data persistence required for the application to function uses <strong>session-based storage</strong>,
                        which is automatically cleared when the browser session ends.
                        Decryption keys are generated dynamically in memory and are never stored persistently on disk or transmitted to our servers.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4">3. Business Associate Agreement (BAA)</h2>
                    <p className="text-gray-400 mb-4">
                        For Enterprise deployments where cloud processing is enabled, BillSaver will execute a Business Associate Agreement (BAA)
                        outlining our permitted uses and disclosures of PHI, as required by 45 CFR 164.502(e)(1).
                        Please contact our sales team to initiate a BAA before using this tool in a production environment with real patient data.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4">4. Usage Limitations</h2>
                    <p className="text-gray-400 mb-4">
                        This tool is an assistive device for certified medical coders and billing specialists.
                        It does not constitute medical advice or a final billing determination.
                        The provider remains responsible for the accuracy and completeness of all claims submitted.
                    </p>
                </div>
            </div>
        </div>
    );
}
