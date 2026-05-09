import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import PWAInstallBanner from "@/components/layout/PWAInstallBanner"
import { AppDataProvider } from "@/components/context/AppDataContext"
import { FinancialVisibilityProvider } from "@/components/context/FinancialVisibilityContext"
import { AuthProvider } from "@/lib/mockAuth"

function App() {
  return (
    <>
      <AuthProvider>
        <PWAInstallBanner />
        <AppDataProvider>
          <FinancialVisibilityProvider>
            <Pages />
          </FinancialVisibilityProvider>
        </AppDataProvider>
        <Toaster />
      </AuthProvider>
    </>
  )
}

export default App 