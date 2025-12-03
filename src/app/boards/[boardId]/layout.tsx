import { ReactNode } from "react"

interface BoardLayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export default function BoardLayout({ children, sidebar }: BoardLayoutProps) {
  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="flex-1 overflow-hidden">{children}</div>
      {sidebar}
    </div>
  )
}
