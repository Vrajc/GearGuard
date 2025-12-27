export default function Footer() {
  return (
    <footer className="bg-white border-t border-odoo-border mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-odoo-text-muted text-sm">
            &copy; {new Date().getFullYear()} GearGuard. The Ultimate Maintenance Tracker.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-odoo-text-muted hover:text-odoo-primary text-sm transition-colors">
              Privacy
            </a>
            <a href="#" className="text-odoo-text-muted hover:text-odoo-primary text-sm transition-colors">
              Terms
            </a>
            <a href="#" className="text-odoo-text-muted hover:text-odoo-primary text-sm transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
