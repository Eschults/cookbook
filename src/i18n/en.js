export default {
  common: {
    browseRecipes: 'Browse recipes',
    remove: 'Remove',
    cancel: 'Cancel',
    close: 'Close',
    shoppingList: 'Shopping list',
    servings: '{n} serving | {n} servings'
  },

  app: {
    title: 'Cookbook',
    tagline: 'Recipes & Shopping List',
    loading: 'Loading recipes…',
    loadingHint: 'Checking GitHub for the latest cookbook.',
    errorTitle: 'Couldn’t load the recipes',
    tryAgain: 'Try again',
    refreshing: 'Refreshing…',
    refresh: 'Refresh',
    unknownError: 'Unknown error',
    language: 'Language'
  },

  nav: {
    recipes: 'Recipes',
    menu: 'Menu',
    list: 'List'
  },

  index: {
    count: '{n} recipe from the RecipeMD collection. | {n} recipes from the RecipeMD collection.',
    searchLabel: 'Search recipes',
    searchPlaceholder: 'Search recipes…',
    all: 'All',
    ingredients: '{n} ingredient | {n} ingredients',
    viewRecipe: 'View recipe',
    emptyTitle: 'No recipes found',
    emptyHint: 'Try another search or clear the filter.'
  },

  recipe: {
    back: 'All recipes',
    makes: 'Makes {yields}',
    addToList: 'Add to shopping list',
    ingredients: 'Ingredients',
    noIngredients: 'This recipe lists no ingredients.',
    asNeeded: 'As needed',
    method: 'Method',
    noInstructions: 'This recipe has no instructions.',
    source: 'Source | Sources',
    notFound: 'Recipe not found',
    backToRecipes: 'Back to recipes'
  },

  list: {
    heading: 'Shopping list',
    remaining: '{n} remaining | {n} remaining',
    total: '{n} total',
    clearChecked: 'Clear checked',
    clearAll: 'Clear all',
    emptyTitle: 'Your cart is empty',
    emptyHint: 'Add a recipe and scale it for the number of people you’re feeding.',
    check: 'Check item',
    confirmRemove: 'Remove {name} from the shopping list?',
    confirmClear: 'Clear the whole shopping list?',
    uncheck: 'Uncheck item',
    group: {
      measured: 'Measured items',
      other: 'Other'
    }
  },

  menu: {
    heading: 'Menu',
    subtitle: 'The recipes behind your current shopping list.',
    openRecipe: 'Open recipe',
    stale: 'Recipe is no longer present in the source repository.',
    emptyTitle: 'No recipes in your menu',
    emptyHint: 'When you add a recipe to your shopping list, it will appear here.'
  },

  dialog: {
    scale: 'Scale {title}',
    servingsKnown: 'The recipe is written for {n} serving. | The recipe is written for {n} servings.',
    servingsUnknown: 'This recipe does not declare a serving count, so enter the multiplier directly.',
    people: 'People',
    multiplier: 'Multiplier',
    example: 'For example, {factor} turns {from} into {to}.',
    add: 'Add to list'
  }
}
