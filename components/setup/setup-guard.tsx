"use client";

import { useEffect, useState } from "react";
import { checkDatabaseStatus } from "@/app/setup/actions";
import { useRouter, usePathname } from "next/navigation";

export function SetupGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const check = async () => {
            // If already on setup, don't check or redirect
            if (pathname?.startsWith("/setup")) {
                setChecked(true);
                return;
            }

            const status = await checkDatabaseStatus();

            if (!status.configured) {
                router.push("/setup");
            }
            setChecked(true);
        };

        check();
    }, [pathname, router]);

    // Optional: Show loading state while checking
    // if (!checked) return null; 

    return <>{children}</>;
}
