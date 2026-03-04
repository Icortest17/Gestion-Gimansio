import Link from "next/link";
import { Dumbbell } from "lucide-react";

export function Navbar() {
    return (
        <nav className="border-b border-border bg-background">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Dumbbell className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold tracking-tight">
                        Fight<span className="text-primary">Manager</span> Pro
                    </span>
                </Link>
            </div>
        </nav>
    );
}
