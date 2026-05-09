import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import PWAInstallBanner from "@/components/layout/PWAInstallBanner"

function App() {
  return (
    <>
      <PWAInstallBanner />
      <Pages />
      <Toaster />
    </>
  )
}

export default App 