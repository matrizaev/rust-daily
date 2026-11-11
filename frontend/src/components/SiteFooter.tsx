const footerLinks = [
  { href: "#playground", label: "Playground" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
  { href: "#privacy", label: "Privacy Policy" },
  { href: "#terms", label: "Terms of Service" },
];

/** Footer links to static project information pages. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav aria-label="Site navigation">
        {footerLinks.map((link) => (
          <a href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <p>© {new Date().getFullYear()} Rust Daily</p>
    </footer>
  );
}
