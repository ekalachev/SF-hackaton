import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MapView } from '@/components/map/MapView'
import { DebugConsole } from '@/components/debug/DebugConsole'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MapView />
      {/* Debug Console - only in development */}
      {import.meta.env.DEV && <DebugConsole />}
    </QueryClientProvider>
  )
}

export default App
