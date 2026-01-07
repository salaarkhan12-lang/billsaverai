export default function DataPolicy() {
    return (
        <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-3xl px-6 lg:px-8 text-white">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-8">Data Handling & Security Policy</h1>
                <div className="prose prose-invert max-w-none">
                    <p className="lead text-gray-300 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-bold mt-8 mb-4">1. Data Security</h2>
                    <p className="text-gray-400 mb-4">
                        Security is paramount at BillSaver. We utilize industry-standard encryption and security practices to protect your data.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4">2. Encryption</h2>
                    <p className="text-gray-400 mb-4">
                        All data is encrypted in transit using TLS 1.2+ and at rest using AES-256 encryption.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4">3. HIPAA Compliance</h2>
                    <p className="text-gray-400 mb-4">
                        We follow HIPAA guidelines for the handling of Protected Health Information (PHI).
                    </p>

                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mt-8">
                        <p className="font-semibold text-blue-200">Note to User:</p>
                        <p className="text-sm text-blue-300 mt-2">
                            This is a placeholder Data Policy. Please consult with legal counsel to draft a compliant policy suitable for your specific business needs and jurisdiction, especially regarding HIPAA compliance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
