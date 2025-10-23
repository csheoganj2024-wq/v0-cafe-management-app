export interface MenuItem {
  id: string
  name: string
  price: number
  category: string
}

export const MENU_ITEMS: MenuItem[] = [
  // COLD COFFEE
  { id: "cc1", name: "Cold Coffee", price: 149, category: "COLD COFFEE" },
  { id: "cc2", name: "Cold Coffee With Ice Cream", price: 179, category: "COLD COFFEE" },
  { id: "cc3", name: "Cookies Tea / Masala Tea", price: 49, category: "COLD COFFEE" },
  { id: "cc4", name: "Black Tea", price: 39, category: "COLD COFFEE" },
  { id: "cc5", name: "Hot Coffee", price: 59, category: "COLD COFFEE" },

  // SHAKE
  { id: "sh1", name: "Vanila Shake", price: 149, category: "SHAKE" },
  { id: "sh2", name: "Chocolate Shake", price: 159, category: "SHAKE" },
  { id: "sh3", name: "Kit Kat Shake", price: 179, category: "SHAKE" },
  { id: "sh4", name: "Oreo Shake", price: 169, category: "SHAKE" },
  { id: "sh5", name: "Butter Scotch Shake", price: 169, category: "SHAKE" },

  // MOCKTAIL
  { id: "mo1", name: "Sunny Setup", price: 169, category: "MOCKTAIL" },
  { id: "mo2", name: "Blue Lugan", price: 149, category: "MOCKTAIL" },
  { id: "mo3", name: "Panch Mel", price: 179, category: "MOCKTAIL" },
  { id: "mo4", name: "Fresh Lemon Soda", price: 99, category: "MOCKTAIL" },
  { id: "mo5", name: "Virgin Mojito", price: 139, category: "MOCKTAIL" },

  // DESERT
  { id: "de1", name: "Vanila Ice Cream", price: 49, category: "DESERT" },
  { id: "de2", name: "Butter Scotch Ice Cream", price: 59, category: "DESERT" },
  { id: "de3", name: "Chocolate Ice Cream", price: 69, category: "DESERT" },
  { id: "de4", name: "Rosperel Ice Cream", price: 89, category: "DESERT" },

  // BURGER
  { id: "bu1", name: "Veg Burger", price: 59, category: "BURGER" },
  { id: "bu2", name: "Veg Cheese Burger", price: 89, category: "BURGER" },

  // SANDWICH
  { id: "sa1", name: "Veg Grill Sandwich", price: 129, category: "SANDWICH" },
  { id: "sa2", name: "Veg Sandwich & French Fry", price: 79, category: "SANDWICH" },
  { id: "sa3", name: "Bombay Sandwich", price: 99, category: "SANDWICH" },
  { id: "sa4", name: "Chipotle Sandwich", price: 89, category: "SANDWICH" },
  { id: "sa5", name: "Bread Butter Cheese Sandwich", price: 59, category: "SANDWICH" },
  { id: "sa6", name: "Paneer Sandwich", price: 169, category: "SANDWICH" },

  // SOUP
  { id: "so1", name: "Hot & Sour Soup", price: 119, category: "SOUP" },
  { id: "so2", name: "Manchau Soup", price: 109, category: "SOUP" },
  { id: "so3", name: "Tomato Soup", price: 129, category: "SOUP" },
  { id: "so4", name: "Sweet Corn Soup", price: 99, category: "SOUP" },
  { id: "so5", name: "Lemon Coriander Soup", price: 130, category: "SOUP" },
  { id: "so6", name: "Cream Mushroom Soup", price: 149, category: "SOUP" },

  // CHINESE
  { id: "ch1", name: "Paneer Chilli", price: 239, category: "CHINESE" },
  { id: "ch2", name: "Honey Chilli", price: 289, category: "CHINESE" },
  { id: "ch3", name: "Chilli Potato", price: 199, category: "CHINESE" },
  { id: "ch4", name: "Chilli Mushroom", price: 239, category: "CHINESE" },
  { id: "ch5", name: "Manchurian Gravy & Dry", price: 199, category: "CHINESE" },
  { id: "ch6", name: "Noodles", price: 169, category: "CHINESE" },
  { id: "ch7", name: "Hakka Noodles", price: 139, category: "CHINESE" },
  { id: "ch8", name: "Schezwan Noodles", price: 179, category: "CHINESE" },

  // RICE
  { id: "ri1", name: "Fried Rice", price: 179, category: "RICE" },
  { id: "ri2", name: "Schezwan Rice", price: 169, category: "RICE" },
  { id: "ri3", name: "Bloom Special Rice", price: 189, category: "RICE" },

  // TANDOOR
  { id: "ta1", name: "Paneer Tikka", price: 269, category: "TANDOOR" },
  { id: "ta2", name: "Achari Paneer Tikka", price: 239, category: "TANDOOR" },
  { id: "ta3", name: "Malai Paneer Tikka", price: 299, category: "TANDOOR" },
  { id: "ta4", name: "Hara Bhara Kabab", price: 199, category: "TANDOOR" },
  { id: "ta5", name: "Corn Kabab", price: 219, category: "TANDOOR" },
  { id: "ta6", name: "Tandoori Soya Chap", price: 199, category: "TANDOOR" },
]

export const CATEGORIES = [
  "COLD COFFEE",
  "SHAKE",
  "MOCKTAIL",
  "DESERT",
  "BURGER",
  "SANDWICH",
  "SOUP",
  "CHINESE",
  "RICE",
  "TANDOOR",
]
