import { ReactNode } from "react";

interface BoardLayoutProps {
  children: ReactNode;
}

export default function BoardLayout({ children }: BoardLayoutProps) {
  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
