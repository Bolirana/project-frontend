const BANNERS = [
  {
    title: 'Bono de Bienvenida',
    desc: 'Hasta $500.000 COP en tu primer depósito',
    cta: 'Reclamar',
    from: 'from-[#f5a623]',
    to: 'to-[#ff6b00]',
    text: 'text-black',
  },
  {
    title: 'Apuesta Sin Riesgo',
    desc: 'Recupera tu apuesta si pierdes el primer combinado',
    cta: 'Activar',
    from: 'from-[#00bfff]',
    to: 'to-[#0077b6]',
    text: 'text-black',
  },
  {
    title: 'Mundial 2026',
    desc: 'Cuotas mejoradas en todos los partidos del grupo',
    cta: 'Ver más',
    from: 'from-[#1e2d3d]',
    to: 'to-[#2a3f55]',
    text: 'text-white',
  },
]

export function PromoBanners() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {BANNERS.map((b) => (
        <div
          key={b.title}
          className={`flex min-h-[120px] flex-col justify-between overflow-hidden rounded-lg bg-gradient-to-br ${b.from} ${b.to} p-4`}
        >
          <div className={b.text}>
            <h3 className="text-lg font-bold leading-tight text-balance">
              {b.title}
            </h3>
            <p className="mt-1 text-xs opacity-90">{b.desc}</p>
          </div>
          <button
            className={`mt-3 w-fit rounded px-3 py-1.5 text-xs font-bold ${
              b.text === 'text-black'
                ? 'bg-black/85 text-white'
                : 'bg-white text-black'
            }`}
          >
            {b.cta}
          </button>
        </div>
      ))}
    </div>
  )
}
