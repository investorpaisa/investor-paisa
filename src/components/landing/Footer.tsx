
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4 bg-gradient-gold bg-clip-text text-transparent">Investor Paisa</h3>
            <p className="text-sm text-black/60 mb-4">
              A community platform empowering users on their financial journeys.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="#" className="text-black/60 hover:text-black">My Feed</Link></li>
              <li><Link to="#" className="text-black/60 hover:text-black">Discover</Link></li>
              <li><Link to="#" className="text-black/60 hover:text-black">Inbox</Link></li>
              <li><Link to="#" className="text-black/60 hover:text-black">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="#" className="text-black/60 hover:text-black">Passive Income</Link></li>
              <li><Link to="#" className="text-black/60 hover:text-black">Active Income</Link></li>
              <li><Link to="#" className="text-black/60 hover:text-black">Taxation</Link></li>
              <li><Link to="#" className="text-black/60 hover:text-black">Personal Finance</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="#" className="text-black/60 hover:text-black">About Us</Link></li>
              <li><Link to="#" className="text-black/60 hover:text-black">Contact</Link></li>
              <li><Link to="#" className="text-black/60 hover:text-black">Privacy Policy</Link></li>
              <li><Link to="#" className="text-black/60 hover:text-black">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-black/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-black/60">
            &copy; {new Date().getFullYear()} Investor Paisa. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="#" className="text-black/60 hover:text-gold transition-colors">
              <span className="sr-only">Twitter</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </Link>
            <Link to="#" className="text-black/60 hover:text-gold transition-colors">
              <span className="sr-only">Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </Link>
            <Link to="#" className="text-black/60 hover:text-gold transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
