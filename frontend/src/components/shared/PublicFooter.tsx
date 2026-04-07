export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-border mt-20">
      <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-8">
        <div>
          <span className="font-serif italic text-foreground text-3xl mb-4 block">
            Safe Harbor
          </span>
          <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
            A sanctuary for those finding their voice. We believe in restorative care, dignity, and endless hope.
          </p>
        </div>
        
        <nav aria-label="Footer navigation">
          <ul className="flex gap-8 text-base font-medium text-foreground/80">
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Our Mission
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Privacy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Contact
              </a>
            </li>
          </ul>
        </nav>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Safe Harbor. Built with care.</p>
      </div>
    </footer>
  );
}
