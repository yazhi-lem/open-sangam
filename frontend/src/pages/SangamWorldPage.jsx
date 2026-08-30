import SangamWorld from '../components/world/SangamWorld'
import { useSearchParams } from 'react-router-dom'

export default function SangamWorldPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SangamWorld />
    </div>
  )
}
