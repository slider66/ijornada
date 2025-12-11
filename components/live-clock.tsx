"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function LiveClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">
                {format(time, "HH:mm:ss")}
            </div>
            <div className="text-sm text-gray-500 capitalize">
                {format(time, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </div>
        </div>
    );
}
