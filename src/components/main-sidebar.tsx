
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Globe, 
  Plus,
  Users, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Public', href: '/feed', icon: Globe },
  { name: 'Add', href: '/create-post', icon: Plus, isSpecial: true },
  { name: 'Circle', href: '/circles', icon: Users },
  { name: 'Inbox', href: '/inbox', icon: MessageSquare },
];

export const MainSidebar = () => {
  const location = useLocation();

  return (
    <motion.aside 
      className="w-64 h-screen bg-black border-r border-white/10 flex flex-col"
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <motion.div 
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-white">
              Investor<span className="text-gold">Paisa</span>
            </h1>
            <p className="text-xs text-white/60">Financial Community</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item, index) => {
          const isActive = location.pathname === item.href;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={item.href}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group
                  ${isActive 
                    ? 'bg-gold/20 text-gold border border-gold/30' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                  }
                  ${item.isSpecial ? 'bg-gold text-black hover:bg-gold/90' : ''}
                `}
              >
                <item.icon className={`h-5 w-5 transition-colors duration-300 ${
                  item.isSpecial ? 'text-black' : 
                  isActive ? 'text-gold' : 'text-white/60 group-hover:text-white'
                }`} />
                <span className="font-medium">{item.name}</span>
                {isActive && !item.isSpecial && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-gold ml-auto"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Premium CTA */}
      <motion.div 
        className="p-4 border-t border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-2">Upgrade to Premium</h3>
          <p className="text-white/60 text-sm mb-3">
            Get advanced analytics and exclusive insights
          </p>
          <motion.button
            className="w-full bg-gradient-to-r from-gold to-gold/90 text-black font-semibold py-2 rounded-lg text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Upgrade Now
          </motion.button>
        </div>
      </motion.div>
    </motion.aside>
  );
};
