import type { FoodItem } from '../types';

export const ALLERGEN_FOODS: FoodItem[] = [
  {
    id: 'allergen-peanuts',
    name: 'Peanuts',
    image_url: 'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Allergen', 'Nuts', 'Snack'],
    savory_score: 60,
    spicy_score: 5,
    fresh_score: 20
  },
  {
    id: 'allergen-tree-nuts',
    name: 'Tree Nuts',
    image_url: 'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Allergen', 'Nuts', 'Snack'],
    savory_score: 55,
    spicy_score: 5,
    fresh_score: 20
  },
  {
    id: 'allergen-shellfish',
    name: 'Shellfish',
    image_url: 'https://images.pexels.com/photos/566344/pexels-photo-566344.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Allergen', 'Seafood'],
    savory_score: 80,
    spicy_score: 10,
    fresh_score: 70
  },
  {
    id: 'allergen-fish',
    name: 'Fish',
    image_url: 'https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Allergen', 'Seafood', 'Protein'],
    savory_score: 70,
    spicy_score: 10,
    fresh_score: 65
  },
  {
    id: 'allergen-dairy',
    name: 'Dairy',
    image_url: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Allergen', 'Dairy', 'Calcium'],
    savory_score: 40,
    spicy_score: 0,
    fresh_score: 50
  },
  {
    id: 'allergen-eggs',
    name: 'Eggs',
    image_url: 'https://images.pexels.com/photos/824635/pexels-photo-824635.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Allergen', 'Protein', 'Breakfast'],
    savory_score: 50,
    spicy_score: 5,
    fresh_score: 30
  },
  {
    id: 'allergen-gluten',
    name: 'Wheat / Gluten',
    image_url: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Allergen', 'Grain', 'Bread'],
    savory_score: 45,
    spicy_score: 0,
    fresh_score: 30
  },
  {
    id: 'allergen-soy',
    name: 'Soy',
    image_url: 'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Allergen', 'Legume', 'Plant-Based'],
    savory_score: 40,
    spicy_score: 5,
    fresh_score: 40
  },
];

export const CUISINE_FOODS: FoodItem[] = [
  {
    id: 'cuisine-cheeseburger',
    name: 'Classic Cheeseburger',
    image_url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['American', 'Juicy', 'Comfort'],
    savory_score: 90,
    spicy_score: 20,
    fresh_score: 25
  },
  {
    id: 'cuisine-sushi',
    name: 'Fresh Sushi Platter',
    image_url: 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Japanese', 'Fresh', 'Delicate'],
    savory_score: 60,
    spicy_score: 15,
    fresh_score: 95
  },
  {
    id: 'cuisine-pizza',
    name: 'Wood-Fired Pizza',
    image_url: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Italian', 'Cheesy', 'Crispy'],
    savory_score: 85,
    spicy_score: 15,
    fresh_score: 40
  },
  {
    id: 'cuisine-tacos',
    name: 'Chicken Tacos',
    image_url: 'https://images.pexels.com/photos/2087748/pexels-photo-2087748.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Mexican', 'Zesty', 'Street Food'],
    savory_score: 75,
    spicy_score: 55,
    fresh_score: 60
  },
  {
    id: 'cuisine-curry',
    name: 'Butter Chicken Curry',
    image_url: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Indian', 'Creamy', 'Rich'],
    savory_score: 90,
    spicy_score: 60,
    fresh_score: 20
  },
  {
    id: 'cuisine-pad-thai',
    name: 'Spicy Pad Thai',
    image_url: 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Thai', 'Tangy', 'Noodles'],
    savory_score: 70,
    spicy_score: 65,
    fresh_score: 50
  },
  {
    id: 'cuisine-steak',
    name: 'Grilled Steak',
    image_url: 'https://images.pexels.com/photos/1251208/pexels-photo-1251208.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['American', 'Smoky', 'Protein'],
    savory_score: 95,
    spicy_score: 10,
    fresh_score: 15
  },
  {
    id: 'cuisine-salad',
    name: 'Greek Salad Bowl',
    image_url: 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Greek', 'Light', 'Healthy'],
    savory_score: 40,
    spicy_score: 5,
    fresh_score: 100
  },
  {
    id: 'cuisine-bbq-ribs',
    name: 'BBQ Ribs',
    image_url: 'https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['BBQ', 'Smoky', 'Hearty'],
    savory_score: 95,
    spicy_score: 30,
    fresh_score: 10
  },
  {
    id: 'cuisine-ramen',
    name: 'Tonkotsu Ramen',
    image_url: 'https://images.pexels.com/photos/1907244/pexels-photo-1907244.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Japanese', 'Warming', 'Umami'],
    savory_score: 85,
    spicy_score: 35,
    fresh_score: 45
  },
  {
    id: 'cuisine-pho',
    name: 'Vietnamese Pho',
    image_url: 'https://images.pexels.com/photos/6646022/pexels-photo-6646022.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Vietnamese', 'Aromatic', 'Warming'],
    savory_score: 75,
    spicy_score: 40,
    fresh_score: 70
  },
  {
    id: 'cuisine-bibimbap',
    name: 'Korean Bibimbap',
    image_url: 'https://images.pexels.com/photos/5900742/pexels-photo-5900742.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Korean', 'Colorful', 'Balanced'],
    savory_score: 70,
    spicy_score: 50,
    fresh_score: 75
  },
];

export const ONBOARDING_FOODS: FoodItem[] = [...ALLERGEN_FOODS, ...CUISINE_FOODS];

export const LOCAL_FOODS: FoodItem[] = CUISINE_FOODS;
