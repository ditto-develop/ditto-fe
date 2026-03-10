export function MainContainer({ children }: { children: React.ReactNode }) {
  return <div className="splash-main">{children}</div>;
}

export function ImgContainer({ children }: { children: React.ReactNode }) {
  return <div className="splash-img-container">{children}</div>;
}