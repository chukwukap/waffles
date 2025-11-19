export const LargeStat = ({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) => (
    <div className="flex flex-col items-center justify-center gap-1.5 w-[162.5px] h-[70px]">
        <p className="text-muted font-display font-medium text-base leading-[1.3] tracking-[-0.03em] text-center">
            {label}
        </p>
        <p className="text-white font-body font-normal text-[38px] leading-[1.3] tracking-normal">
            {typeof value === "number" ? value.toLocaleString() : value}
        </p>
    </div>
);
