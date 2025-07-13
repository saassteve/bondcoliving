import { Users, Coffee, Bath, Wifi, Home, Heart, Map, Sun, Palmtree, Laptop, Sofa, Car, Tv, Wind, Snowflake, Utensils, Bed, Shirt, Shield, Key, Camera, Music, Book, Dumbbell, Waves, Mountain, TreePine, Flower, Zap, Clock, Phone, Mail, Globe, Calendar, Settings, PenTool as Tool, Lightbulb, Star, DivideIcon as LucideIcon } from 'lucide-react';

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  // Basic amenities
  Users,
  Coffee,
  Bath,
  Wifi,
  Home,
  Heart,
  Map,
  Sun,
  Palmtree,
  Laptop,
  Sofa,
  
  // Transportation & Parking
  Car,
  
  // Entertainment & Media
  Tv,
  Music,
  Book,
  Camera,
  
  // Climate & Comfort
  Wind, // Air conditioning
  Snowflake, // Cooling
  Zap, // Heating
  
  // Kitchen & Dining
  Utensils,
  
  // Bedroom & Living
  Bed,
  Shirt, // Wardrobe/closet
  
  // Security & Access
  Shield, // Security
  Key, // Private access
  
  // Fitness & Wellness
  Dumbbell, // Gym/fitness
  
  // Nature & Views
  Waves, // Ocean view
  Mountain, // Mountain view
  TreePine, // Garden view
  Flower, // Balcony/terrace
  
  // Utilities & Services
  Clock, // 24/7 access
  Phone, // Phone service
  Mail, // Mail service
  Globe, // International
  Calendar, // Booking
  Settings, // Maintenance
  Tool, // Repairs
  Lightbulb, // Lighting
  Star, // Premium
  
  // Fallbacks
  Stairs: Users, // Fallback for Stairs since it doesn't exist in lucide-react
};

export const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Users; // Default fallback
};

// Export available icons for admin interface
export const availableIcons = Object.keys(iconMap).filter(key => key !== 'Stairs');