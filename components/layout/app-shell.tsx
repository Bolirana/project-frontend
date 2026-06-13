import { Sidebar } from './sidebar'
import { SubNavbar } from './sub-navbar'
import { TopNavbar } from './top-navbar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d1117]">
      <TopNavbar />
      <SubNavbar />
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <main className="win-scroll min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
