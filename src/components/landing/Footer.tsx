"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
    return (
        <footer
            className="w-full h-[153px] flex items-center justify-center"
            style={{
                background: "linear-gradient(180deg, #1E1E1E 0%, #000000 100%)"
            }}
        >
            <div className="w-full max-w-[1440px] px-4 md:px-[158px] flex justify-between items-center">

                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-[9px]">
                    <div className="relative w-[38px] h-[30px]">
                        <Image
                            src="/logo.png"
                            alt="Waffles Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="font-body text-[25px] leading-none text-white tracking-[-0.03em] mt-1">
                        WAFFLES
                    </span>
                </Link>

                {/* Social Links */}
                <div className="flex items-center gap-[30px]">
                    {/* X (Twitter) */}
                    <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 group"
                    >
                        <span className="font-body text-[25px] leading-none text-white tracking-[-0.03em] group-hover:text-gray-300 transition-colors mt-1">
                            X
                        </span>
                        <span className="text-white group-hover:text-gray-300 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0.000207146 11.9484L1.49377 13.442L10.4551 4.48066L11.9487 5.97421L13.4422 4.48066L11.9487 2.9871L13.4422 1.49354L11.9487 -2.15201e-05L10.4551 1.49354L8.96156 -2.11829e-05L7.468 1.49354L8.96156 2.9871L0.000207146 11.9484ZM4.48088 1.49354L5.97444 -2.10143e-05L7.468 1.49354L5.97444 2.9871L4.48088 1.49354ZM4.48088 1.49354L2.98733 2.9871L1.49377 1.49354L2.98733 -2.08457e-05L4.48088 1.49354ZM11.9487 8.96133L13.4422 7.46777L11.9487 5.97421L10.4551 7.46777L11.9487 8.96133ZM11.9487 8.96133L10.4551 10.4549L11.9487 11.9484L13.4422 10.4549L11.9487 8.96133Z" fill="currentColor" />
                            </svg>
                        </span>
                    </a>

                    {/* Farcaster */}
                    <a
                        href="https://farcaster.xyz/miniapps/sbpPNle-R2-V/waffles"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 group"
                    >
                        <span className="font-body text-[25px] leading-none text-white tracking-[-0.03em] group-hover:text-gray-300 transition-colors mt-1">
                            FARCASTER
                        </span>
                        <span className="text-white group-hover:text-gray-300 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0.000207146 11.9484L1.49377 13.442L10.4551 4.48066L11.9487 5.97421L13.4422 4.48066L11.9487 2.9871L13.4422 1.49354L11.9487 -2.15201e-05L10.4551 1.49354L8.96156 -2.11829e-05L7.468 1.49354L8.96156 2.9871L0.000207146 11.9484ZM4.48088 1.49354L5.97444 -2.10143e-05L7.468 1.49354L5.97444 2.9871L4.48088 1.49354ZM4.48088 1.49354L2.98733 2.9871L1.49377 1.49354L2.98733 -2.08457e-05L4.48088 1.49354ZM11.9487 8.96133L13.4422 7.46777L11.9487 5.97421L10.4551 7.46777L11.9487 8.96133ZM11.9487 8.96133L10.4551 10.4549L11.9487 11.9484L13.4422 10.4549L11.9487 8.96133Z" fill="currentColor" />
                            </svg>
                        </span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
