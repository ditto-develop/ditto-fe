export function MainContainer({ children }: { children: React.ReactNode }) {
  return <div className="splash-main">{children}</div>;
}

export function ImgContainer({ children }: { children: React.ReactNode }) {
  return <div className="splash-img-container">{children}</div>;
}

export function BetaBadge() {
  return <img className="splash-beta-badge" src="/assets/logo/beta-badge.svg" alt="Beta" />;
}