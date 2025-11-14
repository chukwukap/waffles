// app/page.tsx
export default function App() {
  return (
    <>
      {/* HEADER (fixed) */}
      <header className="shrink-0 px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur">
        <h1 className="text-lg font-semibold">My App</h1>
      </header>

      {/* SCROLL AREA */}
      <section className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {[...Array(55)].map((_, i) => (
          <div
            key={i}
            className="w-full p-4 rounded-xl bg-white/10 border border-white/5"
          >
            Row {i + 1}
          </div>
        ))}
      </section>
      <section>
        {" "}
        alsjdlfajsdl
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
      </section>

      {/* FOOTER (fixed) */}
      <footer className="shrink-0 px-4 py-3 border-t border-white/10 bg-black/80 backdrop-blur">
        <button className="w-full py-3 bg-white text-black rounded-xl font-medium">
          Action
        </button>
      </footer>
    </>
  );
}
