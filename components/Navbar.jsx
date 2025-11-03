export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/20 border-b border-white/10">
      <div className="max-w-6xl mx-auto container-pad h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/velotax-mark.svg" alt="Velotax" className="w-7 h-7" />
          <nav className="hidden md:flex items-center gap-2 text-white/80">
            <a className="px-3 py-1.5 rounded-md hover:bg-white/10 transition" href="#">Home</a>
            <a className="px-3 py-1.5 rounded-md bg-white/10" href="#">Envio</a>
            <a className="px-3 py-1.5 rounded-md hover:bg-white/10" href="#">Artigos</a>
            <a className="px-3 py-1.5 rounded-md hover:bg-white/10" href="#">Velotacademy</a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <img src="/velotax-logo.svg" alt="Velotax" className="hidden sm:block h-5 opacity-80" />
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1634FF] to-[#1DFDB9]" />
        </div>
      </div>
    </header>
  );
}


