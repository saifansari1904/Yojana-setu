import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import { WelcomeHeader } from './welcome/WelcomeHeader';
import { WelcomeFooter } from './welcome/WelcomeFooter';
import { HeroSection } from './welcome/HeroSection';
import { TrustStrip } from './welcome/TrustStrip';
import { HowItWorks } from './welcome/HowItWorks';
import { MatchingEngine } from './welcome/MatchingEngine';
import { ExplainableMatch } from './welcome/ExplainableMatch';
import { ProductPreview } from './welcome/ProductPreview';
import { JourneySection } from './welcome/JourneySection';
import { MiniDemo } from './welcome/MiniDemo';
import { Differentiation } from './welcome/Differentiation';
import { TrustSection } from './welcome/TrustSection';
import { AccountConversion } from './welcome/AccountConversion';

interface WelcomeScreenProps {
  onFindSchemes: () => void;
  onSignIn: () => void;
}

/* Section ids observed for the header scroll-spy (nav subset). */
const SPY_IDS = ['welcome-hero', 'welcome-how-it-works', 'welcome-preview', 'welcome-trust'];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onFindSchemes,
  onSignIn,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState('welcome-hero');

  /* Scroll-spy for header active state */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );
    SPY_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    target?.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0E1311] text-[#1A1C1B] dark:text-[#F0F4F2] overflow-x-clip">
      <WelcomeHeader
        activeSection={activeSection}
        onNavigate={scrollToSection}
        onSignIn={onSignIn}
      />
      <main>
        <HeroSection onFindSchemes={onFindSchemes} onNavigate={scrollToSection} />
        <TrustStrip />
        <HowItWorks />
        <MatchingEngine />
        <ExplainableMatch />
        <ProductPreview onFindSchemes={onFindSchemes} />
        <JourneySection />
        <MiniDemo />
        <Differentiation />
        <AccountConversion onSignIn={onSignIn} onFindSchemes={onFindSchemes} />
        <TrustSection />
      </main>
      <WelcomeFooter />
    </div>
  );
};
