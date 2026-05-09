import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import PWAInstallBanner from "@/components/layout/PWAInstallBanner"
import { AppDataProvider } from "@/components/context/AppDataContext"
import { FinancialVisibilityProvider } from "@/components/context/FinancialVisibilityContext"

function App() {
  return (
    <>
      <PWAInstallBanner />
      <AppDataProvider>
        <FinancialVisibilityProvider>
          <Pages />
        </FinancialVisibilityProvider>
      </AppDataProvider>
      <Toaster />
    </>
  )
}

export default App 