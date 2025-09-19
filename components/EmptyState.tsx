export default function EmptyState({ 
  title = "No Sales Found", 
  cta 
}: { 
  title?: string
  cta?: React.ReactNode 
}) {
  return (
    <div className="text-center py-16 text-neutral-500">
      <div className="text-6xl mb-4">🔎</div>
      <div className="text-lg font-medium">{title}</div>
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  )
}
