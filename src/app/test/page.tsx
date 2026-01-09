"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TestResult {
    testId: string;
    result: any;
    metadata?: {
        fileName: string;
        pageCount: number;
        usedOCR: boolean;
        textLength: number;
    };
}

const PAYERS = [
    { id: 'bcbs-national', name: 'BCBS National' },
    { id: 'bcbs-local', name: 'BCBS Local' },
    { id: 'uhc', name: 'UnitedHealthcare' },
    { id: 'aetna', name: 'Aetna' },
    { id: 'cigna', name: 'Cigna' },
    { id: 'medicare', name: 'Traditional Medicare' },
];

export default function TestPage() {
    const [apiKey, setApiKey] = useState("");
    const [filePath, setFilePath] = useState("");
    const [payerId, setPayerId] = useState("bcbs-national");
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedText, setCopiedText] = useState("");

    // Load API key from localStorage on mount
    useEffect(() => {
        const savedKey = localStorage.getItem("billsaver_test_api_key");
        if (savedKey) {
            setApiKey(savedKey);
        }
    }, []);

    // Save API key to localStorage
    const handleApiKeyChange = (key: string) => {
        setApiKey(key);
        if (key) {
            localStorage.setItem("billsaver_test_api_key", key);
        }
    };

    const handleUpload = async () => {
        if (!apiKey) {
            setError("Please enter your API key");
            return;
        }

        if (!filePath) {
            setError("Please enter a file path");
            return;
        }

        setIsLoading(true);
        setError(null);
        setTestResult(null);

        try {
            // Step 1: Get file data from server
            const uploadResponse = await fetch("/api/test/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Test-API-Key": apiKey,
                },
                body: JSON.stringify({
                    filePath,
                    payerId,
                }),
            });

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(uploadData.error || `HTTP ${uploadResponse.status}`);
            }

            if (!uploadData.success) {
                throw new Error(uploadData.error || "Upload failed");
            }

            // Step 2: Process file on client side
            console.log("[Test Page] Processing file client-side...");

            // Convert base64 to File object
            const fileBuffer = Uint8Array.from(atob(uploadData.fileData), c => c.charCodeAt(0));
            const file = new File([fileBuffer], uploadData.fileName, { type: 'application/pdf' });

            // Import the analysis functions
            const { parsePDF } = await import('@/lib/blackbox_pdf-parser');
            const { analyzeDocument } = await import('@/lib/billing-rules');

            // Parse PDF
            console.log("[Test Page] Parsing PDF...");
            const parseResult = await parsePDF(file);
            console.log(`[Test Page] PDF parsed. Pages: ${parseResult.pageCount}, OCR: ${parseResult.usedOCR}`);

            // Analyze document
            console.log("[Test Page] Analyzing document...");
            const analysisResult = await analyzeDocument(parseResult, {
                payerId: uploadData.payerId,
                visitsPerYear: 52
            });
            console.log("[Test Page] Analysis complete");

            // Step 3: Send result back to server for storage
            const storeResponse = await fetch("/api/test/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Test-API-Key": apiKey,
                },
                body: JSON.stringify({
                    result: analysisResult,
                    fileName: uploadData.fileName,
                }),
            });

            const storeData = await storeResponse.json();

            if (!storeResponse.ok || !storeData.success) {
                throw new Error(storeData.error || "Failed to store result");
            }

            // Set the result with metadata
            setTestResult({
                testId: storeData.testId,
                result: analysisResult,
                metadata: {
                    fileName: uploadData.fileName,
                    pageCount: parseResult.pageCount,
                    usedOCR: parseResult.usedOCR || false,
                    textLength: parseResult.text.length
                }
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(label);
            setTimeout(() => setCopiedText(""), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const curlExample = `curl -X POST http://localhost:3000/api/test/upload \\
  -H "Content-Type: application/json" \\
  -H "X-Test-API-Key: ${apiKey || 'your_api_key_here'}" \\
  -d '{"filePath":"C:\\\\path\\\\to\\\\medical-note.pdf","payerId":"bcbs-national"}'`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                        BillSaver Testing API
                    </h1>
                    <p className="text-gray-400">
                        Programmatic interface for automated testing and file uploads
                    </p>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Upload Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                    >
                        {/* API Key */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                API Key
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => handleApiKeyChange(e.target.value)}
                                placeholder="Enter your test API key"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Stored in localStorage. Find in <code className="bg-white/10 px-1 rounded">.env.local</code>
                            </p>
                        </div>

                        {/* File Path */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                File Path (Absolute)
                            </label>
                            <input
                                type="text"
                                value={filePath}
                                onChange={(e) => setFilePath(e.target.value)}
                                placeholder="C:\path\to\medical-note.pdf"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            />
                        </div>

                        {/* Payer Selector */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Payer
                            </label>
                            <select
                                value={payerId}
                                onChange={(e) => setPayerId(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {PAYERS.map((payer) => (
                                    <option key={payer.id} value={payer.id} className="bg-gray-900">
                                        {payer.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Upload Button */}
                        <button
                            onClick={handleUpload}
                            disabled={isLoading || !apiKey || !filePath}
                            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                "Upload & Analyze"
                            )}
                        </button>

                        {/* Error Display */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                            >
                                <p className="text-red-400 text-sm font-medium">Error: {error}</p>
                            </motion.div>
                        )}

                        {/* Success Display */}
                        {testResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-500/10 border border-green-500/30 rounded-xl p-4"
                            >
                                <p className="text-green-400 text-sm font-medium mb-2">
                                    ✓ Analysis Complete
                                </p>
                                <div className="text-xs text-gray-400 space-y-1">
                                    <p>Test ID: <code className="bg-white/10 px-1 rounded">{testResult.testId}</code></p>
                                    {testResult.metadata && (
                                        <>
                                            <p>File: {testResult.metadata.fileName}</p>
                                            <p>Pages: {testResult.metadata.pageCount}</p>
                                            <p>OCR Used: {testResult.metadata.usedOCR ? 'Yes' : 'No'}</p>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Right Column - Results & Documentation */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        {/* JSON Result Viewer */}
                        {testResult && (
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold">Analysis Result</h3>
                                    <button
                                        onClick={() => copyToClipboard(JSON.stringify(testResult.result, null, 2), "result")}
                                        className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm hover:bg-blue-600/30 transition-colors"
                                    >
                                        {copiedText === "result" ? "✓ Copied!" : "Copy JSON"}
                                    </button>
                                </div>
                                <pre className="bg-black/30 rounded-lg p-4 overflow-auto max-h-[500px] text-xs text-gray-300 whitespace-pre-wrap">
                                    {JSON.stringify(testResult.result, null, 2)}
                                </pre>
                            </div>
                        )}

                        {/* cURL Documentation */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <h3 className="text-lg font-semibold mb-3">cURL Example</h3>
                            <div className="relative">
                                <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto text-xs text-gray-300 whitespace-pre">
                                    {curlExample}
                                </pre>
                                <button
                                    onClick={() => copyToClipboard(curlExample, "curl")}
                                    className="absolute top-2 right-2 px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-blue-400 text-xs hover:bg-blue-600/30 transition-colors"
                                >
                                    {copiedText === "curl" ? "✓" : "Copy"}
                                </button>
                            </div>
                        </div>

                        {/* API Endpoints */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <h3 className="text-lg font-semibold mb-3">Available Endpoints</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <code className="text-blue-400">POST /api/test/upload</code>
                                    <p className="text-gray-500 mt-1">Upload and analyze a PDF file</p>
                                </div>
                                <div>
                                    <code className="text-green-400">GET /api/test/results</code>
                                    <p className="text-gray-500 mt-1">Retrieve latest or specific result</p>
                                </div>
                                <div>
                                    <code className="text-purple-400">GET /api/test/health</code>
                                    <p className="text-gray-500 mt-1">Check API health status</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
