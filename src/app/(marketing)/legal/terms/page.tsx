export default function TermsOfService() {
    return (
        <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-3xl px-6 lg:px-8 text-white">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-8">Terms of Service</h1>
                <div className="prose prose-invert max-w-none">
                    <p className="lead text-gray-300 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
                    <p className="text-gray-400 mb-4">
                        By accessing or using the BillSaver service, you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the service.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4">2. Intellectual Property</h2>
                    <p className="text-gray-400 mb-4">
                        The Service and its original content, features and functionality are and will remain the exclusive property of BillSaver and its licensors.
                    </p>

                    <h2 className="text-xl font-bold mt-8 mb-4">3. Termination</h2>
                    <p className="text-gray-400 mb-4">
                        We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>

                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mt-8">
                        <p className="font-semibold text-blue-200">Note to User:</p>
                        <p className="text-sm text-blue-300 mt-2">
                            This is a placeholder Terms of Service. Please consult with legal counsel to draft compliant terms suitable for your specific business needs and jurisdiction.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
