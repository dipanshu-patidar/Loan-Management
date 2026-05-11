import { Mail, Phone, MapPin, Globe, MessageCircle, Briefcase, Camera } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="bg-white pt-24 pb-12 border-t border-slate-100">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img src="/images/Sidebar_logo.png" alt="Point.47" className="h-10 w-auto" />
              <span className="text-2xl font-bold text-primary">Point.47</span>
            </div>
            <p className="text-slate-500 leading-relaxed max-w-xs">
              Next-generation loan management software designed for fast, secure, and transparent lending workflows.
            </p>
            <div className="flex gap-4">
              {[Globe, MessageCircle, Briefcase, Camera].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-soft flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-900 font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {['Home', 'How It Works', 'Eligibility', 'Features', 'FAQ'].map((link) => (
                <li key={link}>
                  <a href={`#${link.toLowerCase().replace(/\s+/g, '-')}`} className="text-slate-500 hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-slate-900 font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-slate-500">
                <Mail size={20} className="text-accent shrink-0" />
                <span>support@point47.com</span>
              </li>
              <li className="flex gap-3 text-slate-500">
                <Phone size={20} className="text-accent shrink-0" />
                <span>+1 (234) 567-890</span>
              </li>
              <li className="flex gap-3 text-slate-500">
                <MapPin size={20} className="text-accent shrink-0" />
                <span>123 Fintech Plaza, Silicon Valley, CA</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-slate-900 font-bold mb-6">Stay Updated</h4>
            <p className="text-sm text-slate-500 mb-4">Get the latest news and updates from Point.47.</p>
            <div className="flex gap-2 p-1.5 bg-soft rounded-xl border border-slate-100">
              <input
                type="email"
                placeholder="Your email"
                className="bg-transparent border-none focus:ring-0 text-sm px-3 flex-1"
              />
              <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-400">
            © {currentYear} Point.47 Loan Management Software. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-sm text-slate-400 hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-400 hover:text-primary transition-colors">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
