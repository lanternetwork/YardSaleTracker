import Image from 'next/image'

export default function Landing() {
  return (
    <main className="relative">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/icons/icon-512.png"
            alt="Neighborhood yard sales community"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 w-full h-full hero-overlay" />
        
        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-hero-mobile sm:text-hero font-bold text-white mb-6">
            Find Amazing <span className="text-accent-300">Yard Sale Treasures</span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
            Discover local yard sales, garage sales, and estate sales in your area. Never miss a great deal again!
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                aria-label="Enter city or zip" 
                className="flex-1 rounded-2xl px-6 py-4 text-lg text-neutral-900 placeholder-neutral-500 shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2" 
                placeholder="Enter your city or zip code" 
              />
              <a 
                href="/explore" 
                className="btn-primary text-lg px-8 py-4 rounded-2xl"
              >
                Find Sales
              </a>
            </div>
          </div>
          
          {/* Secondary CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              className="btn-secondary text-lg px-8 py-4 rounded-2xl bg-white/90 text-neutral-800 hover:bg-white" 
              href="/explore?tab=map"
            >
              View Map
            </a>
            <a 
              className="btn-secondary text-lg px-8 py-4 rounded-2xl bg-white/90 text-neutral-800 hover:bg-white" 
              href="/sell/new"
            >
              Post Your Sale
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
