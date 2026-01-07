import Link from "next/link";

export const Footer = () => {
    return (
        <footer className="bg-[#050508] border-t border-white/10">
            <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
                <div className="md:flex md:justify-between">
                    <div className="mb-6 md:mb-0">
                        <Link href="/" className="flex items-center">
                            <span className="self-center text-2xl font-bold whitespace-nowrap text-white">
                                Bill<span className="text-blue-500">Saver</span>
                            </span>
                        </Link>
                        <p className="mt-4 text-sm text-gray-400 max-w-xs">
                            AI-powered medical documentation analysis to optimize billing accuracy and prevent revenue loss.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
                        <div>
                            <h2 className="mb-6 text-sm font-semibold text-white uppercase">Product</h2>
                            <ul className="text-gray-400 font-medium">
                                <li className="mb-4">
                                    <Link href="/dashboard" className="hover:text-white transition-colors">
                                        Launch App
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/pricing" className="hover:text-white transition-colors">
                                        Pricing
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h2 className="mb-6 text-sm font-semibold text-white uppercase">Legal</h2>
                            <ul className="text-gray-400 font-medium">
                                <li className="mb-4">
                                    <Link href="/legal/privacy" className="hover:text-white transition-colors">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li className="mb-4">
                                    <Link href="/legal/terms" className="hover:text-white transition-colors">
                                        Terms &amp; Conditions
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/legal/data" className="hover:text-white transition-colors">
                                        Data Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h2 className="mb-6 text-sm font-semibold text-white uppercase">Support</h2>
                            <ul className="text-gray-400 font-medium">
                                <li className="mb-4">
                                    <Link href="/contact" className="hover:text-white transition-colors">
                                        Contact Us
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <hr className="my-6 border-white/10 sm:mx-auto lg:my-8" />
                <div className="sm:flex sm:items-center sm:justify-between">
                    <span className="text-sm text-gray-400 sm:text-center">
                        © {new Date().getFullYear()} <Link href="/" className="hover:underline">BillSaver™</Link>. All Rights Reserved.
                    </span>
                    <div className="flex mt-4 sm:justify-center sm:mt-0">
                        {/* Social icons can go here */}
                    </div>
                </div>
            </div>
        </footer>
    );
};
