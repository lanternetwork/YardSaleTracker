import { createExploreMetadata } from '@/lib/metadata'

export const metadata = createExploreMetadata()

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
