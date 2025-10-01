"use client"
export const dynamic = 'force-dynamic'

export default function Landing() {
  return (
    <main className="relative">
      <section className="bg-cover bg-center" style={{backgroundImage:'url(/hero.jpg)'}}>
        <div className="backdrop-brightness-75 py-24 text-center text-white">
          <h1 className="text-5xl font-extrabold">Find Amazing <span className="text-amber-300">Yard Sale Treasures</span></h1>
          <p className="mt-4 text-lg max-w-2xl mx-auto">Discover local yard sales, garage sales, and estate sales in your area. Never miss a great deal again!</p>
          <div className="mt-8 flex justify-center gap-3">
            <input aria-label="Enter city or zip" className="w-[480px] max-w-[90vw] rounded-lg px-4 py-3 text-neutral-900" placeholder="Enter your city or zip code" />
            <a href="/explore" className="rounded-lg bg-amber-500 px-5 py-3 font-semibold">Find Sales</a>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            <a className="rounded border px-4 py-2 bg-white/90 text-neutral-800" href="/explore#map">View Map</a>
            <a className="rounded border px-4 py-2 bg-white/90 text-neutral-800" href="/explore#add">Post Your Sale</a>
          </div>
        </div>
      </section>
    </main>
  )
}
