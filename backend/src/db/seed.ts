import 'dotenv/config';
import { db } from './client';
import { products } from './schema';

const seedProducts = [
  // Dairy (10 products) - 5 marked as common
  { name: 'Whole Milk', normalizedName: 'whole milk', category: 'Dairy', size: '1 gallon', unit: 'gallon', searchTerms: 'milk,dairy,whole milk,vitamin d milk', isCommon: true },
  { name: '2% Milk', normalizedName: '2% milk', category: 'Dairy', size: '1 gallon', unit: 'gallon', searchTerms: 'milk,dairy,2% milk,reduced fat milk', isCommon: true },
  { name: 'Skim Milk', normalizedName: 'skim milk', category: 'Dairy', size: '1 gallon', unit: 'gallon', searchTerms: 'milk,dairy,skim milk,fat free milk', isCommon: false },
  { name: 'Large Eggs', normalizedName: 'large eggs', category: 'Dairy', size: '12 count', unit: 'dozen', searchTerms: 'eggs,dairy,dozen eggs', isCommon: true },
  { name: 'Butter', normalizedName: 'butter', category: 'Dairy', size: '1 lb', unit: 'lb', searchTerms: 'butter,dairy,salted butter', isCommon: true },
  { name: 'Cheddar Cheese', normalizedName: 'cheddar cheese', category: 'Dairy', size: '8 oz', unit: 'oz', searchTerms: 'cheese,dairy,cheddar,shredded cheese', isCommon: true },
  { name: 'Greek Yogurt', normalizedName: 'greek yogurt', category: 'Dairy', size: '32 oz', unit: 'oz', searchTerms: 'yogurt,dairy,greek yogurt', isCommon: false },
  { name: 'Sour Cream', normalizedName: 'sour cream', category: 'Dairy', size: '16 oz', unit: 'oz', searchTerms: 'sour cream,dairy', isCommon: false },
  { name: 'Cream Cheese', normalizedName: 'cream cheese', category: 'Dairy', size: '8 oz', unit: 'oz', searchTerms: 'cream cheese,dairy,philadelphia', isCommon: false },
  { name: 'Half & Half', normalizedName: 'half & half', category: 'Dairy', size: '1 quart', unit: 'quart', searchTerms: 'half and half,dairy,creamer,half & half', isCommon: false },

  // Produce (12 products) - 3 marked as common
  { name: 'Bananas', normalizedName: 'bananas', category: 'Produce', unit: 'lb', searchTerms: 'bananas,fruit,produce', isCommon: true },
  { name: 'Apples', normalizedName: 'apples', category: 'Produce', size: '3 lb bag', unit: 'lb', searchTerms: 'apples,fruit,produce,gala apples,honeycrisp', isCommon: true },
  { name: 'Iceberg Lettuce', normalizedName: 'iceberg lettuce', category: 'Produce', size: '1 head', searchTerms: 'lettuce,produce,salad,iceberg', isCommon: false },
  { name: 'Tomatoes', normalizedName: 'tomatoes', category: 'Produce', unit: 'lb', searchTerms: 'tomatoes,produce,vegetables', isCommon: true },
  { name: 'Yellow Onions', normalizedName: 'yellow onions', category: 'Produce', size: '3 lb bag', unit: 'lb', searchTerms: 'onions,produce,vegetables,yellow onions', isCommon: false },
  { name: 'Russet Potatoes', normalizedName: 'russet potatoes', category: 'Produce', size: '5 lb bag', unit: 'lb', searchTerms: 'potatoes,produce,vegetables,russet', isCommon: false },
  { name: 'Carrots', normalizedName: 'carrots', category: 'Produce', size: '2 lb bag', unit: 'lb', searchTerms: 'carrots,produce,vegetables', isCommon: false },
  { name: 'Broccoli', normalizedName: 'broccoli', category: 'Produce', size: '1 crown', searchTerms: 'broccoli,produce,vegetables', isCommon: false },
  { name: 'Bell Peppers', normalizedName: 'bell peppers', category: 'Produce', searchTerms: 'peppers,bell peppers,produce,vegetables', isCommon: false },
  { name: 'Avocados', normalizedName: 'avocados', category: 'Produce', searchTerms: 'avocados,produce,fruit', isCommon: false },
  { name: 'Oranges', normalizedName: 'oranges', category: 'Produce', size: '4 lb bag', unit: 'lb', searchTerms: 'oranges,fruit,produce,citrus', isCommon: false },
  { name: 'Grapes', normalizedName: 'grapes', category: 'Produce', size: '2 lb bag', unit: 'lb', searchTerms: 'grapes,fruit,produce,red grapes,green grapes', isCommon: false },

  // Bakery (6 products) - 2 marked as common
  { name: 'White Bread', normalizedName: 'white bread', category: 'Bakery', size: '20 oz', unit: 'oz', searchTerms: 'bread,bakery,white bread,sandwich bread', isCommon: true },
  { name: 'Wheat Bread', normalizedName: 'wheat bread', category: 'Bakery', size: '20 oz', unit: 'oz', searchTerms: 'bread,bakery,wheat bread,whole wheat', isCommon: true },
  { name: 'Bagels', normalizedName: 'bagels', category: 'Bakery', size: '6 count', searchTerms: 'bagels,bakery,plain bagels', isCommon: false },
  { name: 'Flour Tortillas', normalizedName: 'flour tortillas', category: 'Bakery', size: '10 count', searchTerms: 'tortillas,bakery,flour tortillas,wraps', isCommon: false },
  { name: 'Hamburger Buns', normalizedName: 'hamburger buns', category: 'Bakery', size: '8 count', searchTerms: 'buns,bakery,hamburger buns,burger buns', isCommon: false },
  { name: 'Hot Dog Buns', normalizedName: 'hot dog buns', category: 'Bakery', size: '8 count', searchTerms: 'buns,bakery,hot dog buns,hotdog buns', isCommon: false },

  // Meat (8 products) - 2 marked as common
  { name: 'Chicken Breast', normalizedName: 'chicken breast', category: 'Meat', unit: 'lb', searchTerms: 'chicken,meat,chicken breast,boneless chicken', isCommon: true },
  { name: 'Ground Beef', normalizedName: 'ground beef', category: 'Meat', unit: 'lb', searchTerms: 'beef,meat,ground beef,hamburger meat', isCommon: true },
  { name: 'Bacon', normalizedName: 'bacon', category: 'Meat', size: '12 oz', unit: 'oz', searchTerms: 'bacon,meat,pork', isCommon: false },
  { name: 'Pork Chops', normalizedName: 'pork chops', category: 'Meat', unit: 'lb', searchTerms: 'pork,meat,pork chops', isCommon: false },
  { name: 'Salmon Fillet', normalizedName: 'salmon fillet', category: 'Meat', unit: 'lb', searchTerms: 'salmon,fish,seafood,meat,atlantic salmon', isCommon: false },
  { name: 'Ground Turkey', normalizedName: 'ground turkey', category: 'Meat', unit: 'lb', searchTerms: 'turkey,meat,ground turkey', isCommon: false },
  { name: 'Deli Ham', normalizedName: 'deli ham', category: 'Meat', unit: 'lb', searchTerms: 'ham,deli,meat,sliced ham', isCommon: false },
  { name: 'Breakfast Sausage', normalizedName: 'breakfast sausage', category: 'Meat', size: '12 oz', unit: 'oz', searchTerms: 'sausage,meat,breakfast sausage,pork sausage', isCommon: false },

  // Pantry (10 products) - 2 marked as common
  { name: 'White Rice', normalizedName: 'white rice', category: 'Pantry', size: '2 lb', unit: 'lb', searchTerms: 'rice,pantry,white rice,long grain rice', isCommon: true },
  { name: 'Spaghetti Pasta', normalizedName: 'spaghetti pasta', category: 'Pantry', size: '16 oz', unit: 'oz', searchTerms: 'pasta,pantry,spaghetti,noodles', isCommon: true },
  { name: 'Cheerios Cereal', normalizedName: 'cheerios cereal', category: 'Pantry', size: '12 oz', unit: 'oz', searchTerms: 'cereal,pantry,cheerios,breakfast', isCommon: false },
  { name: 'Ground Coffee', normalizedName: 'ground coffee', category: 'Pantry', size: '12 oz', unit: 'oz', searchTerms: 'coffee,pantry,ground coffee', isCommon: false },
  { name: 'Black Beans', normalizedName: 'black beans', category: 'Pantry', size: '15 oz can', unit: 'oz', searchTerms: 'beans,pantry,black beans,canned beans', isCommon: false },
  { name: 'Tomato Sauce', normalizedName: 'tomato sauce', category: 'Pantry', size: '15 oz can', unit: 'oz', searchTerms: 'tomato sauce,pantry,sauce,pasta sauce', isCommon: false },
  { name: 'Peanut Butter', normalizedName: 'peanut butter', category: 'Pantry', size: '16 oz', unit: 'oz', searchTerms: 'peanut butter,pantry,spread', isCommon: false },
  { name: 'Vegetable Oil', normalizedName: 'vegetable oil', category: 'Pantry', size: '48 oz', unit: 'oz', searchTerms: 'oil,pantry,vegetable oil,cooking oil', isCommon: false },
  { name: 'All-Purpose Flour', normalizedName: 'all-purpose flour', category: 'Pantry', size: '5 lb', unit: 'lb', searchTerms: 'flour,pantry,all-purpose flour,baking', isCommon: false },
  { name: 'Granulated Sugar', normalizedName: 'granulated sugar', category: 'Pantry', size: '4 lb', unit: 'lb', searchTerms: 'sugar,pantry,granulated sugar,white sugar', isCommon: false },

  // Beverages (4 products) - 1 marked as common
  { name: 'Orange Juice', normalizedName: 'orange juice', category: 'Beverages', size: '64 oz', unit: 'oz', searchTerms: 'orange juice,beverages,juice,oj', isCommon: true },
  { name: 'Apple Juice', normalizedName: 'apple juice', category: 'Beverages', size: '64 oz', unit: 'oz', searchTerms: 'apple juice,beverages,juice', isCommon: false },
  { name: 'Bottled Water', normalizedName: 'bottled water', category: 'Beverages', size: '24 pack', searchTerms: 'water,beverages,bottled water,drinking water', isCommon: false },
  { name: 'Coca-Cola', normalizedName: 'coca-cola', category: 'Beverages', size: '12 pack', searchTerms: 'soda,beverages,coca-cola,coke,cola', isCommon: false },
];

async function seed() {
  console.log('🌱 Starting seed process...');

  try {
    // Insert products
    console.log(`📦 Inserting ${seedProducts.length} products...`);

    for (const product of seedProducts) {
      await db.insert(products).values(product);
    }

    console.log('✅ Seed completed successfully!');
    console.log(`📊 Total products: ${seedProducts.length}`);
    console.log(`⭐ Common products: ${seedProducts.filter(p => p.isCommon).length}`);

    // Show category breakdown
    const categoryBreakdown = seedProducts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📋 Category breakdown:');
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
