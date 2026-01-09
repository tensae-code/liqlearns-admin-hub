import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Star,
  ShoppingCart,
  BookOpen,
  Headphones,
  Video,
  FileText,
  Gamepad2,
  Users,
  Heart,
  ChevronRight,
  Sparkles,
  Trophy,
  TrendingUp
} from 'lucide-react';

const categories = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'ebooks', label: 'E-Books', icon: FileText },
  { id: 'audio', label: 'Audio', icon: Headphones },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'kids', label: 'Kids', icon: Users },
];

const products = [
  {
    id: 1,
    title: 'Complete Amharic Masterclass',
    description: 'From beginner to fluent in 90 days with this comprehensive course.',
    price: 49.99,
    originalPrice: 79.99,
    category: 'courses',
    rating: 4.9,
    reviews: 234,
    image: '📚',
    seller: 'LiqLearns Official',
    badge: 'bestseller',
    xpBonus: 500,
  },
  {
    id: 2,
    title: 'Ethiopian Culture Deep Dive',
    description: 'Explore the rich heritage and traditions of Ethiopia.',
    price: 29.99,
    category: 'courses',
    rating: 4.8,
    reviews: 156,
    image: '🏛️',
    seller: 'Cultural Academy',
    badge: 'new',
    xpBonus: 300,
  },
  {
    id: 3,
    title: 'Amharic Audiobook Collection',
    description: 'Listen and learn with 50+ hours of native speaker recordings.',
    price: 19.99,
    category: 'audio',
    rating: 4.7,
    reviews: 89,
    image: '🎧',
    seller: 'AudioLearn Pro',
    xpBonus: 150,
  },
  {
    id: 4,
    title: 'Kids Alphabet Adventure',
    description: 'Fun and interactive Fidel learning for young minds.',
    price: 14.99,
    category: 'kids',
    rating: 5.0,
    reviews: 312,
    image: '🎨',
    seller: 'KidsFirst Learning',
    badge: 'top-rated',
    xpBonus: 200,
  },
  {
    id: 5,
    title: 'Grammar Essentials E-Book',
    description: 'Master Amharic grammar rules with clear explanations.',
    price: 9.99,
    category: 'ebooks',
    rating: 4.6,
    reviews: 78,
    image: '📖',
    seller: 'Language Lab',
    xpBonus: 100,
  },
  {
    id: 6,
    title: 'Vocabulary Quest Game',
    description: 'Learn 1000+ words through interactive gameplay.',
    price: 12.99,
    category: 'games',
    rating: 4.8,
    reviews: 203,
    image: '🎮',
    seller: 'GameLearn Studios',
    badge: 'popular',
    xpBonus: 250,
  },
  {
    id: 7,
    title: 'Conversational Amharic Videos',
    description: '100 real-world dialogue scenarios with native speakers.',
    price: 34.99,
    category: 'videos',
    rating: 4.7,
    reviews: 145,
    image: '🎬',
    seller: 'VideoClass Pro',
    xpBonus: 350,
  },
  {
    id: 8,
    title: 'Ethiopian Stories for Kids',
    description: 'Traditional folktales adapted for young learners.',
    price: 11.99,
    category: 'kids',
    rating: 4.9,
    reviews: 187,
    image: '📕',
    seller: 'StoryTime Ethiopia',
    xpBonus: 120,
  },
];

const featuredBundle = {
  title: 'Ultimate Language Bundle',
  description: 'Get everything you need to master Amharic - courses, audio, games, and more!',
  originalPrice: 199.99,
  price: 99.99,
  items: ['5 Full Courses', '10+ Audiobooks', '3 Games', '15 E-Books'],
  xpBonus: 2000,
};

const Marketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState<number[]>([]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleWishlist = (id: number) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getBadgeVariant = (badge?: string) => {
    switch (badge) {
      case 'bestseller': return 'default';
      case 'new': return 'secondary';
      case 'top-rated': return 'outline';
      case 'popular': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">Marketplace</h1>
            <p className="text-muted-foreground">Discover courses, e-books, and learning materials</p>
          </div>
          <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart (0)
          </Button>
        </div>
      </motion.div>

      {/* Featured Bundle Banner */}
      <motion.div
        className="mb-8 p-6 rounded-2xl bg-gradient-hero text-primary-foreground relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-gold" />
              <span className="text-gold font-medium">Limited Time Offer</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold mb-2">{featuredBundle.title}</h2>
            <p className="text-primary-foreground/80 mb-4">{featuredBundle.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {featuredBundle.items.map((item) => (
                <span key={item} className="px-3 py-1 bg-primary-foreground/20 rounded-full text-sm">
                  {item}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gold">${featuredBundle.price}</span>
                <span className="text-lg text-primary-foreground/60 line-through">${featuredBundle.originalPrice}</span>
              </div>
              <Badge className="bg-gold text-gold-foreground">
                <Star className="w-3 h-3 mr-1" />
                +{featuredBundle.xpBonus} XP
              </Badge>
            </div>
          </div>
          <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold">
            Get Bundle Now
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="shrink-0">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </motion.div>

      {/* Categories */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className={`shrink-0 ${selectedCategory === cat.id ? 'bg-gradient-accent text-accent-foreground' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <cat.icon className="w-4 h-4 mr-2" />
            {cat.label}
          </Button>
        ))}
      </motion.div>

      {/* Trending Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-semibold text-foreground">Trending Now</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {products.filter(p => p.badge).slice(0, 4).map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border shrink-0 min-w-[280px] hover:border-accent/30 transition-all cursor-pointer"
            >
              <span className="text-3xl">{product.image}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{product.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold">${product.price}</span>
                  <div className="flex items-center text-gold">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs ml-1">{product.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Products Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product, i) => (
          <motion.div
            key={product.id}
            className="bg-card rounded-xl border border-border overflow-hidden hover:border-accent/30 hover:shadow-lg transition-all group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
          >
            {/* Product Image Area */}
            <div className="relative p-6 bg-gradient-card flex items-center justify-center">
              <span className="text-6xl group-hover:scale-110 transition-transform">{product.image}</span>
              
              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  wishlist.includes(product.id) ? 'bg-destructive text-destructive-foreground' : 'bg-card/80 text-muted-foreground hover:text-destructive'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
              </button>

              {/* Badge */}
              {product.badge && (
                <Badge 
                  className="absolute top-3 left-3 capitalize"
                  variant={getBadgeVariant(product.badge)}
                >
                  {product.badge}
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{product.seller}</p>
              <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-accent transition-colors line-clamp-1">
                {product.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center text-gold">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium ml-1">{product.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground">({product.reviews} reviews)</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  +{product.xpBonus} XP
                </Badge>
              </div>

              {/* Price and Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-accent">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                  )}
                </div>
                <Button size="sm" className="bg-gradient-accent text-accent-foreground hover:opacity-90">
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Kids Section */}
      {selectedCategory === 'all' && (
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-display font-semibold text-foreground">Kids Creation Marketplace</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory('kids')}>
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-warm border border-border">
            <div className="grid sm:grid-cols-2 gap-4">
              {products.filter(p => p.category === 'kids').map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-accent/30 transition-all cursor-pointer"
                >
                  <span className="text-4xl">{product.image}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{product.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-accent font-bold">${product.price}</span>
                      <div className="flex items-center text-gold text-sm">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="ml-1">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default Marketplace;
