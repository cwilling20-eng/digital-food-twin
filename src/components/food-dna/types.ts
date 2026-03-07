export const ALLERGY_OPTIONS = [
  'Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Dairy',
  'Eggs', 'Wheat/Gluten', 'Soy', 'Sesame'
] as const;

export const SENSITIVITY_OPTIONS = [...ALLERGY_OPTIONS] as const;

export const DIETARY_RESTRICTIONS = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo',
  'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Low-FODMAP'
] as const;

export const HEALTH_GOALS = [
  'Low Sodium', 'Low Sugar', 'High Protein', 'Low Carb',
  'Heart Healthy', 'Low Calorie', 'High Fiber'
] as const;

export const TEXTURE_OPTIONS = [
  'Crispy', 'Crunchy', 'Creamy', 'Smooth', 'Chewy', 'Tender', 'Firm', 'Flaky'
] as const;

export const PORTION_OPTIONS = ['Small', 'Medium', 'Large', 'Shareable'] as const;

export const CUISINE_OPTIONS = [
  'American', 'Mexican', 'Italian', 'Chinese', 'Japanese', 'Thai',
  'Indian', 'Mediterranean', 'French', 'Korean', 'Vietnamese',
  'Greek', 'Middle Eastern', 'BBQ', 'Seafood', 'Comfort Food', 'Healthy/Clean'
] as const;

export const COMMON_DISLIKES = [
  'Olives', 'Anchovies', 'Blue Cheese', 'Liver', 'Mushrooms',
  'Onions', 'Cilantro', 'Mayo', 'Pickles', 'Tomatoes',
  'Avocado', 'Beets', 'Brussels Sprouts', 'Tofu'
] as const;

export const MEAL_TYPE_SUGGESTIONS: Record<string, string[]> = {
  breakfast: [
    'Eggs Benedict', 'Pancakes', 'Avocado Toast', 'Smoothie Bowl',
    'Bacon', 'French Toast', 'Oatmeal', 'Breakfast Burrito',
    'Waffles', 'Croissant', 'Bagel & Lox', 'Acai Bowl'
  ],
  brunch: [
    'Eggs Benedict', 'Mimosas', 'Belgian Waffles', 'Shakshuka',
    'Chicken & Waffles', 'Quiche', 'Brioche French Toast', 'Smoked Salmon'
  ],
  lunch: [
    'Caesar Salad', 'Club Sandwich', 'Burger', 'Poke Bowl',
    'Tacos', 'Soup & Salad', 'Wrap', 'Rice Bowl', 'Sushi Roll'
  ],
  dinner: [
    'Steak', 'Pasta', 'Salmon', 'Chicken Parmesan', 'Curry',
    'BBQ Ribs', 'Lobster', 'Duck', 'Lamb Chops', 'Ramen'
  ],
  snacks: [
    'Hummus & Pita', 'Chips & Guac', 'Cheese Board', 'Nachos',
    'Popcorn', 'Trail Mix', 'Fruit', 'Protein Bar'
  ],
  desserts: [
    'Chocolate Cake', 'Tiramisu', 'Creme Brulee', 'Ice Cream',
    'Cheesecake', 'Churros', 'Macarons', 'Apple Pie'
  ],
  drinks: [
    'Coffee', 'Matcha Latte', 'Smoothie', 'Fresh Juice',
    'Cocktail', 'Wine', 'Craft Beer', 'Bubble Tea'
  ]
};

export interface DietaryConstraints {
  allergies: string[];
  sensitivities: string[];
  restrictions: string[];
  healthGoals: string[];
  neverEat: string[];
}

export interface FlavorProfile {
  sweetPreference: number;
  saltyPreference: number;
  sourPreference: number;
  bitterPreference: number;
  umamiPreference: number;
  spicyPreference: number;
  preferredTextures: string[];
  dislikedTextures: string[];
  breakfastHeaviness: number;
  lunchHeaviness: number;
  dinnerHeaviness: number;
  adventurousEater: number;
  portionPreference: string;
}

export interface MealFavorites {
  mealType: string;
  foodItems: string[];
  cuisinePreferences: string[];
}

export interface CuisinePreference {
  cuisineType: string;
  favoriteDishes: string[];
  favoriteProteins: string[];
  favoritePreparations: string[];
  spiceLevel: number;
  adventureLevel: number;
  stylePreferences: string[];
  avoidItems: string[];
  extraPreferences: Record<string, unknown>;
}

export interface FoodDislikes {
  dislikedFoods: string[];
  avoidIngredients: string[];
}

export interface FoodDnaData {
  dietaryConstraints: DietaryConstraints;
  flavorProfile: FlavorProfile;
  mealFavorites: MealFavorites[];
  cuisinePreferences: CuisinePreference[];
  foodDislikes: FoodDislikes;
  completionPercentage: number;
}

export const CUISINE_CONFIGS: Record<string, {
  emoji: string;
  label: string;
  dishes: string[];
  proteins: string[];
  styles: string[];
  extras: string[];
}> = {
  'sushi-japanese': {
    emoji: '🍣',
    label: 'Sushi & Japanese',
    dishes: ['California Roll', 'Spicy Tuna', 'Rainbow Roll', 'Dragon Roll', 'Spider Roll', 'Philadelphia Roll', 'Tempura Roll'],
    proteins: ['Salmon', 'Tuna', 'Yellowtail', 'Eel', 'Shrimp', 'Scallop', 'Octopus', 'Crab'],
    styles: ['Nigiri', 'Sashimi', 'Maki Rolls', 'Hand Rolls', 'Omakase'],
    extras: ['Tempura', 'Ramen', 'Udon', 'Teriyaki', 'Edamame', 'Miso Soup', 'Gyoza']
  },
  'mexican': {
    emoji: '🌮',
    label: 'Mexican',
    dishes: ['Tacos', 'Burritos', 'Enchiladas', 'Quesadillas', 'Fajitas', 'Tamales', 'Chile Relleno', 'Tostadas'],
    proteins: ['Carne Asada', 'Carnitas', 'Pollo', 'Al Pastor', 'Barbacoa', 'Chorizo', 'Fish', 'Shrimp'],
    styles: ['Soft Corn', 'Soft Flour', 'Crispy Shell'],
    extras: ['Guacamole', 'Queso', 'Chips & Salsa', 'Mexican Rice', 'Refried Beans', 'Elote', 'Pico de Gallo']
  },
  'italian': {
    emoji: '🍝',
    label: 'Italian',
    dishes: ['Spaghetti', 'Penne', 'Fettuccine', 'Rigatoni', 'Linguine', 'Ravioli', 'Gnocchi', 'Lasagna'],
    proteins: ['Chicken', 'Shrimp', 'Meatballs', 'Sausage', 'Veal', 'Salmon', 'Clams'],
    styles: ['Marinara', 'Alfredo', 'Bolognese', 'Pesto', 'Vodka', 'Carbonara', 'Primavera', 'Aglio e Olio'],
    extras: ['Bruschetta', 'Caprese', 'Tiramisu', 'Garlic Bread', 'Risotto', 'Osso Buco', 'Antipasto']
  },
  'bbq': {
    emoji: '🍖',
    label: 'BBQ & Smokehouse',
    dishes: ['Brisket', 'Pulled Pork', 'Ribs', 'Burnt Ends', 'Smoked Chicken', 'Tri-Tip', 'Sausage Links'],
    proteins: ['Beef', 'Pork', 'Chicken', 'Turkey', 'Lamb'],
    styles: ['Texas Style', 'Kansas City', 'Carolina', 'Memphis'],
    extras: ['Mac & Cheese', 'Coleslaw', 'Baked Beans', 'Cornbread', 'Potato Salad', 'Pickles', 'Collard Greens']
  },
  'chinese': {
    emoji: '🥡',
    label: 'Chinese',
    dishes: ['Kung Pao Chicken', 'General Tso', 'Orange Chicken', 'Beef & Broccoli', 'Lo Mein', 'Fried Rice', 'Sweet & Sour', 'Mapo Tofu'],
    proteins: ['Chicken', 'Beef', 'Pork', 'Shrimp', 'Tofu', 'Duck'],
    styles: ['Cantonese', 'Szechuan', 'Hunan', 'Dim Sum'],
    extras: ['Egg Rolls', 'Dumplings', 'Hot & Sour Soup', 'Wonton Soup', 'Crab Rangoon', 'Spring Rolls']
  },
  'thai': {
    emoji: '🍜',
    label: 'Thai',
    dishes: ['Pad Thai', 'Green Curry', 'Red Curry', 'Massaman Curry', 'Tom Yum', 'Pad See Ew', 'Drunken Noodles', 'Larb'],
    proteins: ['Chicken', 'Beef', 'Shrimp', 'Tofu', 'Pork', 'Duck'],
    styles: ['Mild', 'Medium', 'Thai Hot'],
    extras: ['Spring Rolls', 'Satay', 'Papaya Salad', 'Tom Kha', 'Sticky Rice', 'Thai Iced Tea', 'Mango Sticky Rice']
  },
  'indian': {
    emoji: '🍛',
    label: 'Indian',
    dishes: ['Butter Chicken', 'Tikka Masala', 'Vindaloo', 'Korma', 'Biryani', 'Palak Paneer', 'Dal', 'Tandoori'],
    proteins: ['Chicken', 'Lamb', 'Goat', 'Shrimp', 'Paneer', 'Chickpeas'],
    styles: ['North Indian', 'South Indian', 'Tandoori', 'Curry House'],
    extras: ['Naan', 'Samosas', 'Pakora', 'Raita', 'Mango Chutney', 'Rice', 'Lassi']
  },
  'american': {
    emoji: '🍔',
    label: 'American/Burgers',
    dishes: ['Classic Burger', 'Bacon Cheeseburger', 'Mushroom Swiss', 'BBQ Burger', 'Turkey Burger', 'Veggie Burger'],
    proteins: ['Beef', 'Turkey', 'Chicken', 'Veggie Patty', 'Bison'],
    styles: ['Classic', 'Smash Burger', 'Gourmet', 'Fast Food'],
    extras: ['Fries', 'Onion Rings', 'Milkshake', 'Coleslaw', 'Mac & Cheese', 'Loaded Fries']
  },
  'mediterranean': {
    emoji: '🥗',
    label: 'Mediterranean',
    dishes: ['Falafel', 'Shawarma', 'Gyro', 'Kabob', 'Moussaka', 'Souvlaki'],
    proteins: ['Lamb', 'Chicken', 'Beef', 'Falafel', 'Fish'],
    styles: ['Greek', 'Lebanese', 'Turkish', 'Israeli'],
    extras: ['Hummus', 'Baba Ganoush', 'Tabbouleh', 'Pita', 'Tzatziki', 'Greek Salad', 'Dolmas']
  },
  'pizza': {
    emoji: '🍕',
    label: 'Pizza',
    dishes: ['Margherita', 'Pepperoni', 'Supreme', 'Hawaiian', 'Meat Lovers', 'Veggie', 'BBQ Chicken', 'White Pizza'],
    proteins: ['Pepperoni', 'Sausage', 'Bacon', 'Chicken', 'Anchovies', 'Prosciutto'],
    styles: ['New York', 'Neapolitan', 'Chicago Deep Dish', 'Detroit', 'Sicilian', 'Wood-Fired'],
    extras: ['Garlic Knots', 'Breadsticks', 'Caesar Salad', 'Wings', 'Calzone', 'Stromboli']
  },
  'korean': {
    emoji: '🥢',
    label: 'Korean',
    dishes: ['Korean BBQ', 'Bibimbap', 'Bulgogi', 'Japchae', 'Kimchi Jjigae', 'Sundubu', 'Galbi'],
    proteins: ['Beef', 'Pork Belly', 'Chicken', 'Short Rib', 'Tofu', 'Seafood'],
    styles: ['BBQ', 'Stew', 'Rice Bowl', 'Noodles'],
    extras: ['Kimchi', 'Banchan', 'Korean Fried Chicken', 'Tteokbokki', 'Japchae', 'Kimbap', 'Soju']
  },
  'vietnamese': {
    emoji: '🍲',
    label: 'Vietnamese',
    dishes: ['Pho', 'Banh Mi', 'Bun', 'Com', 'Spring Rolls', 'Vermicelli Bowl'],
    proteins: ['Beef', 'Chicken', 'Pork', 'Shrimp', 'Tofu', 'Rare Steak'],
    styles: ['Noodle Soup', 'Rice Plate', 'Sandwich', 'Vermicelli'],
    extras: ['Spring Rolls', 'Summer Rolls', 'Vietnamese Coffee', 'Banh Xeo', 'Che', 'Sriracha', 'Hoisin']
  },
  'seafood': {
    emoji: '🦐',
    label: 'Seafood',
    dishes: ['Lobster', 'Crab Legs', 'Shrimp Scampi', 'Fish & Chips', 'Clam Chowder', 'Ceviche', 'Seafood Boil'],
    proteins: ['Lobster', 'Crab', 'Shrimp', 'Salmon', 'Tuna', 'Oysters', 'Mussels', 'Scallops'],
    styles: ['Grilled', 'Fried', 'Steamed', 'Raw Bar', 'Cajun Boil'],
    extras: ['Cocktail Sauce', 'Butter', 'Lemon', 'Tartar Sauce', 'Hush Puppies', 'Coleslaw']
  },
  'steakhouse': {
    emoji: '🥩',
    label: 'Steakhouse',
    dishes: ['Ribeye', 'Filet Mignon', 'New York Strip', 'Porterhouse', 'T-Bone', 'Prime Rib', 'Wagyu'],
    proteins: ['Beef', 'Lamb Chops', 'Pork Chop', 'Veal'],
    styles: ['Rare', 'Medium Rare', 'Medium', 'Medium Well', 'Well Done'],
    extras: ['Loaded Baked Potato', 'Creamed Spinach', 'Lobster Tail', 'Caesar Salad', 'Onion Rings', 'Mushrooms']
  }
};
