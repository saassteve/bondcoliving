// In components/ApartmentPreview.tsx
// ... imports and logic state same as before ...

// Replace the return JSX logic inside the map with this styling:
return (
  <Link
    key={a.id}
    to={`/room/${apartmentService.generateSlug(a.title)}`}
    className="group relative flex-none w-80 md:w-[400px] snap-center"
  >
    <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gray-900 border border-white/10">
      <AvailabilityBadge iso={a.available_from} />
      
      <img
        src={a.image_url}
        alt={a.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
      />
      
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

      {/* Content positioned absolute at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-2xl font-bold text-[#C5C5B5]">{a.title}</h3>
          <div className="text-right">
            <div className="text-xl font-medium text-white">{formatMoney(a.price, 'EUR')}</div>
            <div className="text-xs text-white/50 uppercase tracking-wider">per month</div>
          </div>
        </div>

        {/* Features - hidden by default, shown on hover or always shown on mobile if preferred */}
        <div className="flex flex-wrap gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
          {a.features?.slice(0, 3).map((f, idx) => (
            <span key={idx} className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
              {f.label}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 text-[#C5C5B5] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
          View Apartment <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  </Link>
);