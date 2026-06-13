import { MatchListing } from '@/components/eventos/match-listing'
import { Paises } from '@/components/eventos/paises'
import { PromoBanners } from '@/components/eventos/promo-banners'

export default function HomePage() {
  return (
    <div className="space-y-6 p-4">
      <PromoBanners />
      <MatchListing />
      <Paises />
    </div>
  )
}
