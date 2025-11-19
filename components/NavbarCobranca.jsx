export default function NavbarCobranca() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#000058]/90 border-b border-white/10">
      <div className="max-w-6xl mx-auto container-pad h-14 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2">
            <img src="/brand/velotax-symbol.png" alt="Velotax" className="h-7 w-auto" />
            <span className="hidden sm:inline text-sm font-semibold tracking-wide">Cobrança • Velotax</span>
          </a>
          <nav className="hidden md:flex items-center gap-2 text-white/80 text-sm">
            <a className="px-3 py-1.5 rounded-md hover:bg-white/10 transition" href="/monitoria-cobranca">Monitoria</a>
            <a className="px-3 py-1.5 rounded-md hover:bg-white/10 transition" href="/monitoria-cobranca-dashboard">Dashboard</a>
          </nav>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <a
            href="/"
            className="px-3 py-1.5 rounded-full border border-white/30 text-white/80 hover:bg-white hover:text-[#000058] transition"
          >
            Voltar ao painel
          </a>
        </div>
      </div>
    </header>
  );
}
