import Image from "next/image";

export const IconStatCard = ({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value: string | number;
}) => (
    <div
        className="flex h-[99px] w-[156px] flex-col items-center justify-center gap-1"
    >
        <Image
            src={icon}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9"
            priority={false}
        />
        <p
            className="font-display font-medium text-base leading-[130%] tracking-[-0.03em] text-center text-[#99A0AE]"
        >
            {label}
        </p>
        <p
            className="font-body font-normal text-[38px] leading-none tracking-normal text-white"
        >
            {typeof value === "number" ? value.toLocaleString() : value}
        </p>
    </div>
);
