import { UtensilsCrossed, Linkedin, Instagram, Facebook, Twitter, Apple, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#f0f0f5] text-[#686b78] pt-14 pb-8 border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* ── Top Section (Grid) ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Logo & Copyright Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Zuno Logo" className="h-10 w-auto object-contain rounded-2xl" />
            </div>
            <p className="text-xs text-[#93959f]">
              © {currentYear} Zuno Limited
            </p>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-bold text-[#282c3f] text-sm md:text-base mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li><Link to="#" className="hover:text-[#282c3f] transition-colors">About Us</Link></li>
              <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Zuno Corporate</Link></li>
              <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Careers</Link></li>
              <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Team</Link></li>
              <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Zuno One</Link></li>
            </ul>
          </div>

          {/* Contact & Legal Column */}
          <div>
            <div className="mb-6">
              <h4 className="font-bold text-[#282c3f] text-sm md:text-base mb-4 uppercase tracking-wider">Contact us</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Help & Support</Link></li>
                <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Partner With Us</Link></li>
                <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Ride With Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#282c3f] text-sm md:text-base mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Terms & Conditions</Link></li>
                <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Cookie Policy</Link></li>
                <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Available in Column */}
          <div>
            <h4 className="font-bold text-[#282c3f] text-sm md:text-base mb-4 uppercase tracking-wider">Available in:</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/" className="text-[#282c3f] hover:text-[#fc8019] transition-colors font-bold">Hyderabad</Link>
              </li>
              <li className="flex items-center justify-between gap-2 max-w-[150px]">
                <span className="text-gray-400">Bangalore</span>
                <span className="text-[10px] bg-gray-200/60 text-gray-500 px-1.5 py-0.5 rounded-md font-bold scale-90">Soon</span>
              </li>
              <li className="flex items-center justify-between gap-2 max-w-[150px]">
                <span className="text-gray-400">Gurgaon</span>
                <span className="text-[10px] bg-gray-200/60 text-gray-500 px-1.5 py-0.5 rounded-md font-bold scale-90">Soon</span>
              </li>
              <li className="flex items-center justify-between gap-2 max-w-[150px]">
                <span className="text-gray-400">Delhi</span>
                <span className="text-[10px] bg-gray-200/60 text-gray-500 px-1.5 py-0.5 rounded-md font-bold scale-90">Soon</span>
              </li>
              <li className="flex items-center justify-between gap-2 max-w-[150px]">
                <span className="text-gray-400">Mumbai</span>
                <span className="text-[10px] bg-gray-200/60 text-gray-500 px-1.5 py-0.5 rounded-md font-bold scale-90">Soon</span>
              </li>
              <li className="flex items-center justify-between gap-2 max-w-[150px]">
                <span className="text-gray-400">Pune</span>
                <span className="text-[10px] bg-gray-200/60 text-gray-500 px-1.5 py-0.5 rounded-md font-bold scale-90">Soon</span>
              </li>
            </ul>
            <button className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#93959f] text-xs font-semibold hover:border-[#282c3f] hover:text-[#282c3f] transition-all">
              1 city <span>▼</span>
            </button>
          </div>

          {/* Life & Social Links Column */}
          <div>
            <div className="mb-6">
              <h4 className="font-bold text-[#282c3f] text-sm md:text-base mb-4 uppercase tracking-wider">Life at Zuno</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Explore With Zuno</Link></li>
                <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Zuno News</Link></li>
                <li><Link to="#" className="hover:text-[#282c3f] transition-colors">Snackables</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#282c3f] text-sm md:text-base mb-3 uppercase tracking-wider">Social Links</h4>
              <div className="flex items-center gap-3">
                <a href="#" className="w-9 h-9 rounded-full bg-[#282c3f] hover:bg-[#fc8019] text-white flex items-center justify-center transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-[#282c3f] hover:bg-[#fc8019] text-white flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-[#282c3f] hover:bg-[#fc8019] text-white flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-[#282c3f] hover:bg-[#fc8019] text-white flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* ── Bottom Section (App Download Promo) ── */}
        <div className="border-t border-gray-300 pt-8 mt-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-heading font-extrabold text-lg sm:text-xl md:text-2xl text-[#282c3f] text-center md:text-left leading-tight">
            For better experience, download the Zuno app now
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* App Store Badge */}
            <a 
              href="#" 
              className="flex items-center gap-3 bg-[#000000] text-white px-5 py-2.5 rounded-2xl hover:opacity-90 transition-opacity w-44 select-none border border-white/10"
            >
              <Apple className="w-7 h-7 text-white fill-white flex-shrink-0" />
              <div className="text-left">
                <p className="text-[9px] uppercase font-bold tracking-wider text-gray-400 leading-none">Download on the</p>
                <p className="text-sm font-extrabold -mt-0.5 leading-none">App Store</p>
              </div>
            </a>
            
            {/* Google Play Badge */}
            <a 
              href="#" 
              className="flex items-center gap-3 bg-[#000000] text-white px-5 py-2.5 rounded-2xl hover:opacity-90 transition-opacity w-44 select-none border border-white/10"
            >
              <Play className="w-7 h-7 text-white fill-white flex-shrink-0" />
              <div className="text-left">
                <p className="text-[9px] uppercase font-bold tracking-wider text-gray-400 leading-none">GET IT ON</p>
                <p className="text-sm font-extrabold -mt-0.5 leading-none">Google Play</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
