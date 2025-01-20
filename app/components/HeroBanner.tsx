'use client';

interface HeroBannerProps {
  isLoggedIn: boolean;
}

export default function HeroBanner({ isLoggedIn }: HeroBannerProps) {
  return (
    <div className="hero-banner">
      <div className="hero-content">
        <div className="hero-icon animate-float">₿</div>
        <h1 className="hero-title tracking-tight">
          Predict Crypto Prices Together
        </h1>
        <p className="hero-subtitle font-light">
          Share price targets and vote on the community's best insights
        </p>
        <button className="hero-cta">
          {isLoggedIn ? "Add Your Next Prediction" : "Start Predicting Today"}
        </button>
      </div>
      <div className="hero-particles"></div>
    </div>
  );
} 