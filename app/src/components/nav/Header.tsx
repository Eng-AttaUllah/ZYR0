import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, LogOut, User, LayoutDashboard, Settings,
  Building2, Sun, Moon, HelpCircle, MessageCircle, BookOpen,
  Shield, FileText, Cookie, BadgeCheck, Sparkles, Menu as MenuIcon, X
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useOptionalCompanyAccess } from '@/contexts/CompanyAccessContext';
import { productsList } from '@/components/platform-home/data';

const productLogos: Record<string, string> = {
  studio: '/logos/studio.png',
  edu: '/logos/schoolOS.png',
  research: '/logos/research.png',
};

const resources = [
  { label: 'Help Center', href: '/help', icon: HelpCircle },
  { label: 'FAQ', href: '/faq', icon: MessageCircle },
  { label: 'Blog', href: '/blog', icon: BookOpen, badge: 'Soon' },
  { label: 'Verify Certificate', href: '/verify', icon: BadgeCheck },
  { label: 'Privacy Policy', href: '/privacy', icon: Shield },
  { label: 'Terms of Service', href: '/terms', icon: FileText },
  { label: 'Cookie Policy', href: '/cookies', icon: Cookie },
];

const company = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Careers', href: '/careers' },
];

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const companyAccess = useOptionalCompanyAccess();
  const effectiveRole = profile?.role || null;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [islandOpen, setIslandOpen] = useState(false);

  const productsRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => {
      const isPast = window.scrollY > 80;
      setScrolled(isPast);
      if (!isPast) {
        setIslandOpen(false);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (productsRef.current && !productsRef.current.contains(target)) {
        setProductsOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(target)) {
        setResourcesOpen(false);
      }
      if (companyRef.current && !companyRef.current.contains(target)) {
        setCompanyOpen(false);
      }
      if (islandRef.current && !islandRef.current.contains(target)) {
        setIslandOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    setProductsOpen(false);
    setResourcesOpen(false);
    setCompanyOpen(false);
    setMobileOpen(false);
    setMobileSection(null);
    setProfileOpen(false);
    setIslandOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const scrollTo = (hash: string) => {
    if (location.pathname !== '/') {
      navigate(`/${hash}`);
    } else {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300">
      {/* Mobile Header: Compact bar on < md screens */}
      <div className="md:hidden max-w-7xl mx-auto px-4 pt-4 pointer-events-auto">
        <div
          className={`rounded-2xl transition-all duration-300 border ${
            scrolled
              ? 'bg-black/90 dark:bg-black/90 backdrop-blur-xl border-white/15 shadow-2xl shadow-black/80 py-3 px-5'
              : 'bg-black/50 dark:bg-black/40 backdrop-blur-md border-white/10 py-3.5 px-5'
          } flex items-center justify-between`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="text-xl font-display tracking-tight text-white">
              ZYR0
            </span>
          </Link>

          {/* Mobile Right */}
          <div className="flex items-center gap-2">
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {mounted && theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-neutral-300 hover:text-white rounded-lg bg-white/5 border border-white/10"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Header: Morphing Dynamic Island on scroll */}
      <div className="hidden md:block">
        <AnimatePresence mode="wait">
          {!scrolled ? (
            /* Full-width desktop navbar at the top */
            <m.div
              key="desktop-full-navbar"
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pointer-events-auto"
            >
              <div className="rounded-2xl transition-all duration-300 border bg-black/50 dark:bg-black/40 backdrop-blur-md border-white/10 py-3.5 px-5 sm:px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                  <span className="text-xl font-display tracking-tight text-white">
                    ZYR0
                  </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="flex items-center gap-1">
                  {/* Products */}
                  <div className="relative" ref={productsRef}>
                    <button
                      type="button"
                      onClick={() => { setProductsOpen(!productsOpen); setResourcesOpen(false); setCompanyOpen(false); }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                        productsOpen
                          ? 'text-white bg-white/10'
                          : 'text-neutral-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Products
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          productsOpen ? 'rotate-180 text-accent-400' : 'text-neutral-400'
                        }`}
                      />
                    </button>

                    {productsOpen && (
                      <div className="absolute top-full left-0 mt-2 w-[340px] sm:w-[480px] p-2 rounded-xl bg-neutral-950 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/90 z-50">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/40 to-transparent rounded-t-xl" />
                        {productsList.map((product) => (
                          <Link
                            key={product.id}
                            to={product.href}
                            onClick={() => setProductsOpen(false)}
                            className="flex items-start gap-3 p-3 rounded-lg transition-all group hover:bg-white/5"
                          >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-white/5 border border-white/10 group-hover:scale-105 transition-transform overflow-hidden">
                              {productLogos[product.id] ? (
                                <img src={productLogos[product.id]} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-display text-sm text-white">{product.name.charAt(4)}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium text-white group-hover:text-accent-400 transition-colors">{product.name}</span>
                                {product.badge && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 border border-white/10">
                                    {product.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs leading-relaxed line-clamp-2 text-neutral-400">
                                {product.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <button
                    type="button"
                    onClick={() => scrollTo('#pricing')}
                    className="px-3.5 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    Pricing
                  </button>

                  {/* Resources */}
                  <div className="relative" ref={resourcesRef}>
                    <button
                      type="button"
                      onClick={() => { setResourcesOpen(!resourcesOpen); setProductsOpen(false); setCompanyOpen(false); }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                        resourcesOpen
                          ? 'text-white bg-white/10'
                          : 'text-neutral-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Resources
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          resourcesOpen ? 'rotate-180 text-accent-400' : 'text-neutral-400'
                        }`}
                      />
                    </button>

                    {resourcesOpen && (
                      <div className="absolute top-full left-0 mt-2 w-[240px] p-1.5 rounded-xl bg-neutral-950 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/90 z-50">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/40 to-transparent rounded-t-xl" />
                        {resources.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setResourcesOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all group hover:bg-white/5"
                          >
                            <item.icon className="w-4 h-4 text-neutral-400 group-hover:text-accent-400 transition-colors" />
                            <span className="flex-1 text-neutral-300 group-hover:text-white transition-colors">{item.label}</span>
                            {item.badge && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 border border-white/10">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Company */}
                  <div className="relative" ref={companyRef}>
                    <button
                      type="button"
                      onClick={() => { setCompanyOpen(!companyOpen); setProductsOpen(false); setResourcesOpen(false); }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                        companyOpen
                          ? 'text-white bg-white/10'
                          : 'text-neutral-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Company
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          companyOpen ? 'rotate-180 text-accent-400' : 'text-neutral-400'
                        }`}
                      />
                    </button>

                    {companyOpen && (
                      <div className="absolute top-full left-0 mt-2 w-[200px] p-1.5 rounded-xl bg-neutral-950 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/90 z-50">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/40 to-transparent rounded-t-xl" />
                        {company.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setCompanyOpen(false)}
                            className="block px-3 py-2 text-sm rounded-lg transition-all group hover:bg-white/5 text-neutral-300 group-hover:text-white"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </nav>

                {/* Desktop Right */}
                <div className="flex items-center gap-3">
                  <button
                    aria-label="Toggle theme"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {mounted && theme === 'dark' ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </button>

                  {user ? (
                    <div className="relative">
                      <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        <img
                          src={user.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=User'}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="hidden lg:inline">
                          {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {profileOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-neutral-950 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/90 py-1 z-50">
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/40 to-transparent rounded-t-xl" />
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-sm font-medium text-white">
                              {user.user_metadata?.full_name || 'User'}
                            </p>
                            <p className="text-xs text-neutral-400">{user.email}</p>
                          </div>
                          <div className="py-1">
                            {effectiveRole ? (
                              <>
                                <button
                                  onClick={() => { setProfileOpen(false); navigate(`/${effectiveRole}/dashboard`); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                                </button>
                                {companyAccess?.hasAccess && effectiveRole !== 'company' && (
                                  companyAccess.companies && companyAccess.companies.length > 1 ? (
                                    companyAccess.companies.map((c) => (
                                      <button
                                        key={c.company.id}
                                        onClick={async () => {
                                          setProfileOpen(false);
                                          try { localStorage.setItem('zyro_last_workspace', 'company'); } catch {}
                                          await companyAccess.switchCompany(c.company.id);
                                          navigate('/company/dashboard');
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-accent-400 hover:bg-white/5 transition-colors"
                                      >
                                        <Building2 className="w-4 h-4" /> Switch to {c.company.name}
                                      </button>
                                    ))
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setProfileOpen(false);
                                        try { localStorage.setItem('zyro_last_workspace', 'company'); } catch {}
                                        navigate('/company/dashboard');
                                      }}
                                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-accent-400 hover:bg-white/5 transition-colors"
                                    >
                                      <Building2 className="w-4 h-4" /> Switch to {companyAccess.company?.name || 'Company'}
                                    </button>
                                  )
                                )}
                                <button
                                  onClick={() => { setProfileOpen(false); navigate(`/${effectiveRole}/profile`); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                  <User className="w-4 h-4" /> Profile
                                </button>
                                <button
                                  onClick={() => { setProfileOpen(false); navigate(`/${effectiveRole}/settings`); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                  <Settings className="w-4 h-4" /> Settings
                                </button>
                              </>
                            ) : (
                              <div className="px-4 py-2 text-sm text-neutral-400">Loading...</div>
                            )}
                          </div>
                          <div className="border-t border-white/10 pt-1">
                            <button
                              onClick={async () => { await signOut(); navigate('/'); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Link
                        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                        className="px-3.5 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        to={`/register?redirect=${encodeURIComponent(location.pathname)}`}
                        className="px-4 py-2 text-sm font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all shadow-md shadow-white/10"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </m.div>
          ) : (
            /* Converged Dynamic Island Capsule / Morphing Menu */
            <m.div
              key="desktop-dynamic-island-wrapper"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="fixed top-4 inset-x-0 flex justify-center z-50 pointer-events-none"
            >
              <div
                ref={islandRef}
                className="pointer-events-auto flex justify-center"
              >
                <AnimatePresence mode="wait">
                {!islandOpen ? (
                  /* Floating Sleek Capsule */
                  <m.button
                    key="island-capsule"
                    type="button"
                    onClick={() => setIslandOpen(true)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                    className="group relative flex items-center gap-3 px-4 py-2 rounded-full bg-neutral-950/85 hover:bg-neutral-900/95 text-white backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 hover:border-white/30 transition-all cursor-pointer"
                    aria-label="Open navigation menu"
                  >
                    {/* Top ambient gloss line */}
                    <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/50 to-transparent" />

                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-accent-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center text-accent-300">
                        <Sparkles className="w-2.5 h-2.5" />
                      </div>
                      <span className="font-display text-sm tracking-tight text-white font-semibold">ZYR0</span>
                    </div>

                    <div className="w-px h-3.5 bg-white/20" />

                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-300 group-hover:text-white transition-colors">
                      <span>Menu</span>
                      <MenuIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                    </div>
                  </m.button>
                ) : (
                  /* Morphing Dropdown Island Card */
                  <m.div
                    key="island-expanded-card"
                    initial={{ opacity: 0, y: -10, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                    className="w-[380px] sm:w-[480px] max-w-[92vw] rounded-3xl bg-neutral-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] p-4 overflow-hidden relative"
                  >
                    {/* Subtle top edge shine */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/50 to-transparent" />

                    {/* Island Top Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <Link to="/" onClick={() => setIslandOpen(false)} className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-white tracking-tight">ZYR0</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-accent-400/10 text-accent-300 border border-accent-400/20">
                          Platform
                        </span>
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                          aria-label="Toggle theme"
                        >
                          {mounted && theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setIslandOpen(false)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Close menu"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="py-3">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2 px-1">
                        Products
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {productsList.slice(0, 6).map((prod) => (
                          <Link
                            key={prod.id}
                            to={prod.href}
                            onClick={() => setIslandOpen(false)}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                              {productLogos[prod.id] ? (
                                <img src={productLogos[prod.id]} alt={prod.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-white">{prod.name.charAt(4)}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-white group-hover:text-accent-400 transition-colors truncate">
                                {prod.name}
                              </div>
                              <div className="text-[10px] text-neutral-400 truncate">
                                {prod.badge || 'Platform OS'}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Quick Nav Links */}
                    <div className="py-2.5 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                      <button
                        onClick={() => { setIslandOpen(false); scrollTo('#pricing'); }}
                        className="py-1.5 px-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 text-xs font-medium text-neutral-300 hover:text-white transition-all"
                      >
                        Pricing
                      </button>
                      <Link
                        to="/help"
                        onClick={() => setIslandOpen(false)}
                        className="py-1.5 px-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 text-xs font-medium text-neutral-300 hover:text-white transition-all"
                      >
                        Help Center
                      </Link>
                      <Link
                        to="/about"
                        onClick={() => setIslandOpen(false)}
                        className="py-1.5 px-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 text-xs font-medium text-neutral-300 hover:text-white transition-all"
                      >
                        About
                      </Link>
                    </div>

                    {/* Auth / Account Controls */}
                    <div className="pt-2.5 border-t border-white/10">
                      {user ? (
                        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white/[0.03]">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={user.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=User'}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                            <span className="text-xs font-medium text-white truncate">
                              {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {effectiveRole && (
                              <button
                                onClick={() => { setIslandOpen(false); navigate(`/${effectiveRole}/dashboard`); }}
                                className="px-2.5 py-1 text-xs font-medium bg-white text-black hover:bg-neutral-200 rounded-lg transition-colors"
                              >
                                Dashboard
                              </button>
                            )}
                            <button
                              onClick={async () => { await signOut(); setIslandOpen(false); navigate('/'); }}
                              className="p-1 text-neutral-400 hover:text-red-400 rounded-lg transition-colors"
                              title="Sign out"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                            onClick={() => setIslandOpen(false)}
                            className="flex-1 py-2 text-center text-xs font-medium text-neutral-300 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                          >
                            Sign In
                          </Link>
                          <Link
                            to={`/register?redirect=${encodeURIComponent(location.pathname)}`}
                            onClick={() => setIslandOpen(false)}
                            className="flex-1 py-2 text-center text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-colors shadow-md shadow-white/10"
                          >
                            Get Started
                          </Link>
                        </div>
                      )}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden pointer-events-auto">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <m.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="absolute top-0 inset-x-0 max-h-[100dvh] overflow-y-auto bg-neutral-950 border-b border-white/10 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
          >
            <div className="flex items-center justify-between px-5 h-16">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 shrink-0">
                <span className="text-xl font-display tracking-tight text-white">ZYR0</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex items-center justify-center min-w-11 min-h-11 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 pb-8">
              {/* User info — logged in only */}
              {user && (
                <div className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zyro-purple to-zyro-sapphire flex items-center justify-center text-white font-semibold text-sm border border-white/20">
                      {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{user.user_metadata?.full_name || 'User'}</div>
                      <div className="text-xs text-neutral-400 truncate">{user.email}</div>
                    </div>
                  </div>
                  {effectiveRole ? (
                    <Link
                      to={`/${effectiveRole}/dashboard`}
                      onClick={() => setMobileOpen(false)}
                      className="w-full py-2.5 text-center text-sm font-semibold text-black bg-white rounded-xl flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                    </Link>
                  ) : (
                    <div className="w-full py-2.5 text-center text-sm text-neutral-400">Loading...</div>
                  )}
                </div>
              )}

              {/* Products — accordion */}
              <button
                type="button"
                onClick={() => setMobileSection(mobileSection === 'products' ? null : 'products')}
                className="w-full flex items-center justify-between py-3 text-sm font-semibold text-white"
              >
                <span>Products</span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${mobileSection === 'products' ? 'rotate-180' : ''}`} />
              </button>
              {mobileSection === 'products' && (
                <div className="grid grid-cols-1 gap-1.5 pb-3">
                  {productsList.map((product) => (
                    <Link
                      key={product.id}
                      to={product.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 overflow-hidden shrink-0">
                        {productLogos[product.id] ? (
                          <img src={productLogos[product.id]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-display text-xs">{product.name.charAt(4)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">{product.name}</div>
                        <div className="text-[11px] text-neutral-400 line-clamp-1">{product.badge}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="h-px bg-white/10" />

              {/* Pricing — standalone */}
              <button
                onClick={() => { setMobileOpen(false); scrollTo('#pricing'); }}
                className="w-full flex items-center justify-between py-3 text-sm font-semibold text-white text-left"
              >
                Pricing
              </button>

              <div className="h-px bg-white/10" />

              {/* Resources — accordion */}
              <button
                type="button"
                onClick={() => setMobileSection(mobileSection === 'resources' ? null : 'resources')}
                className="w-full flex items-center justify-between py-3 text-sm font-semibold text-white"
              >
                <span>Resources</span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${mobileSection === 'resources' ? 'rotate-180' : ''}`} />
              </button>
              {mobileSection === 'resources' && (
                <div className="flex flex-col gap-0.5 pb-3">
                  {resources.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 min-h-11 px-3 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-neutral-400" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 border border-white/10">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              <div className="h-px bg-white/10" />

              {/* Company — accordion */}
              <button
                type="button"
                onClick={() => setMobileSection(mobileSection === 'company' ? null : 'company')}
                className="w-full flex items-center justify-between py-3 text-sm font-semibold text-white"
              >
                <span>Company</span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${mobileSection === 'company' ? 'rotate-180' : ''}`} />
              </button>
              {mobileSection === 'company' && (
                <div className="flex flex-col gap-0.5 pb-3">
                  {company.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center min-h-11 px-3 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              <div className="h-px bg-white/10" />

              {/* Bottom section: account links (logged in) or auth buttons (logged out) */}
              <div className="pt-4 flex flex-col gap-2">
                {user ? (
                  <div className="flex flex-col gap-0.5">
                    {companyAccess?.hasAccess && effectiveRole && effectiveRole !== 'company' && (
                      companyAccess.companies && companyAccess.companies.length > 1 ? (
                        companyAccess.companies.map((c) => (
                          <button
                            key={c.company.id}
                            onClick={async () => {
                              setMobileOpen(false);
                              try { localStorage.setItem('zyro_last_workspace', 'company'); } catch {}
                              await companyAccess.switchCompany(c.company.id);
                              navigate('/company/dashboard');
                            }}
                            className="flex items-center gap-3 min-h-11 px-3 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
                          >
                            <Building2 className="w-4 h-4 text-neutral-400" /> Switch to {c.company.name}
                          </button>
                        ))
                      ) : (
                        <Link
                          to="/company/dashboard"
                          onClick={() => {
                            setMobileOpen(false);
                            try { localStorage.setItem('zyro_last_workspace', 'company'); } catch {}
                          }}
                          className="flex items-center gap-3 min-h-11 px-3 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-neutral-400" /> Switch to {companyAccess.company?.name || 'Company'}
                        </Link>
                      )
                    )}
                    {effectiveRole && (
                      <>
                        <Link
                          to={`/${effectiveRole}/profile`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 min-h-11 px-3 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <User className="w-4 h-4 text-neutral-400" /> Profile
                        </Link>
                        <Link
                          to={`/${effectiveRole}/settings`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 min-h-11 px-3 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-neutral-400" /> Settings
                        </Link>
                      </>
                    )}
                    <button
                      onClick={async () => { await signOut(); setMobileOpen(false); navigate('/'); }}
                      className="flex items-center gap-3 min-h-11 px-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to={`/register?redirect=${encodeURIComponent(location.pathname)}`}
                      onClick={() => setMobileOpen(false)}
                      className="w-full py-3 text-center text-sm font-semibold text-black bg-white rounded-xl shadow-lg"
                    >
                      Get Started Free
                    </Link>
                    <Link
                      to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                      onClick={() => setMobileOpen(false)}
                      className="w-full py-3 text-center text-sm font-medium text-neutral-300 hover:text-white border border-white/10 rounded-xl"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          </m.div>
        </div>
      )}
    </header>
  );
}
