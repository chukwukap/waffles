export default function Backdrop({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-40 bg-black/50 transition-all duration-500 ease-in-out
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    />
  );
}
