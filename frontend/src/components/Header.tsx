import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  logoText?: string;
  navItems?: NavItem[];
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export default function Header({
  logoText = "MyApp",
  navItems = [
    { label: "Home", href: "#" },
    { label: "Sobre", href: "#" },
    { label: "Serviços", href: "#" },
    { label: "Contato", href: "#" },
  ],
  ctaLabel = "Entrar",
  onCtaClick,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <h1 className="text-xl font-bold text-gray-800">
          {logoText}
        </h1>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-gray-600 hover:text-black transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <button
            onClick={onCtaClick}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            {ctaLabel}
          </button>
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden flex flex-col gap-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span
            className={`block h-0.5 w-6 bg-black transition-all ${isOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
          />
          <span
            className={`block h-0.5 w-6 bg-black transition-all ${isOpen ? "opacity-0" : ""
              }`}
          />
          <span
            className={`block h-0.5 w-6 bg-black transition-all ${isOpen ? "-rotate-45 -translate-y-1.5" : ""
              }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-6 pb-4">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-gray-600 hover:text-black transition-colors"
              >
                {item.label}
              </a>
            ))}

            <button
              onClick={onCtaClick}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              {ctaLabel}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
