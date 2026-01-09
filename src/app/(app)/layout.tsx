import { ReactNode } from "react";
import { SecurityIndicator } from "@/components/security/SecurityBadge";

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0a0a0f] relative">
            {children}

            {/* Security Indicator - Bottom Right Corner */}
            <div className="fixed bottom-4 right-4 z-40">
                <SecurityIndicator />
            </div>
        </div>
    );
}
