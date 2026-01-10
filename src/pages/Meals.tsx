import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, ChefHat, Clock, Sparkles, LogOut, Plus, Trash2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecipeDialog } from "@/components/RecipeDialog";

interface UserGoals {
  goal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface SuggestedRecipe {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
  difficulty: string;
  ingredients?: string[];
  steps?: string[];
}

const Meals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  
  // User goals state
  const [userGoals, setUserGoals] = useState<UserGoals | null>(null);
  const [suggestedRecipes, setSuggestedRecipes] = useState<SuggestedRecipe[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [viewingSuggestedRecipe, setViewingSuggestedRecipe] = useState<SuggestedRecipe | null>(null);
  const [viewingSavedRecipe, setViewingSavedRecipe] = useState<any>(null);
  
  // New recipe form state
  const [isCreateRecipeOpen, setIsCreateRecipeOpen] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: "",
    description: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    time: "",
    difficulty: "Easy",
    meal_plan_id: "",
  });
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);

  useEffect(() => {
    fetchMealPlans();
    fetchRecipes();
    fetchUserGoals();
  }, []);

  const fetchUserGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setUserGoals(data);
    }
  };

  const getAISuggestions = async () => {
    if (!userGoals) {
      toast({
        title: "No goals set",
        description: "Please set your nutrition goals first in the Goals section.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-recipes', {
        body: {
          goalType: userGoals.goal_type,
          calories: userGoals.calories,
          protein: userGoals.protein,
          carbs: userGoals.carbs,
          fats: userGoals.fats,
        }
      });

      if (error) throw error;

      if (data.recipes && Array.isArray(data.recipes)) {
        setSuggestedRecipes(data.recipes);
        toast({
          title: "Recipes generated!",
          description: "AI has suggested recipes based on your goals.",
        });
      }
    } catch (error: any) {
      console.error("Error getting suggestions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get recipe suggestions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const addSuggestedRecipe = async (recipe: SuggestedRecipe, planId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          meal_plan_id: planId || null,
          name: recipe.name,
          description: recipe.description,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fats: recipe.fats,
          time: recipe.time,
          difficulty: recipe.difficulty,
          ingredients: recipe.ingredients || null,
          steps: recipe.steps || null,
        });

      if (error) throw error;

      toast({
        title: "Recipe saved!",
        description: `${recipe.name} has been added to your recipes.`,
      });

      fetchRecipes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save recipe",
        variant: "destructive",
      });
    }
  };

  const fetchMealPlans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching meal plans:", error);
      return;
    }

    setMealPlans(data || []);
  };

  const fetchRecipes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recipes:", error);
      return;
    }

    setRecipes(data || []);
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a plan name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingPlan(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("meal_plans")
        .insert({
          user_id: user.id,
          name: newPlanName,
          description: newPlanDescription,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Meal plan created successfully",
      });

      setNewPlanName("");
      setNewPlanDescription("");
      fetchMealPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create meal plan",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Meal plan deleted successfully",
      });

      fetchMealPlans();
      fetchRecipes(); // Recipes will be deleted automatically via CASCADE
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal plan",
        variant: "destructive",
      });
    }
  };

  const handleViewRecipe = (recipe: any) => {
    setSelectedRecipe(recipe);
    setIsRecipeDialogOpen(true);
  };

  const handleAddToPlan = async (recipeId: string, planId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find the default recipe data
      const defaultRecipe = defaultRecipes.find(r => r.id === recipeId);
      if (!defaultRecipe) return;

      const { error } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          meal_plan_id: planId,
          name: defaultRecipe.name,
          description: defaultRecipe.description,
          calories: defaultRecipe.calories,
          protein: defaultRecipe.protein,
          carbs: defaultRecipe.carbs,
          fats: defaultRecipe.fats,
          time: defaultRecipe.time,
          difficulty: defaultRecipe.difficulty,
        });

      if (error) throw error;

      toast({
        title: "Added to plan!",
        description: `${defaultRecipe.name} added to your meal plan`,
      });

      fetchRecipes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add recipe to plan",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromPlan = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);

      if (error) throw error;

      toast({
        title: "Removed",
        description: "Recipe removed from meal plan",
      });

      fetchRecipes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove recipe",
        variant: "destructive",
      });
    }
  };

  const handleCreateRecipe = async () => {
    if (!newRecipe.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a recipe name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingRecipe(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          meal_plan_id: newRecipe.meal_plan_id || null,
          name: newRecipe.name,
          description: newRecipe.description || null,
          calories: parseInt(newRecipe.calories) || 0,
          protein: parseInt(newRecipe.protein) || 0,
          carbs: parseInt(newRecipe.carbs) || 0,
          fats: parseInt(newRecipe.fats) || 0,
          time: newRecipe.time || "15 min",
          difficulty: newRecipe.difficulty,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Recipe created successfully",
      });

      setNewRecipe({
        name: "",
        description: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        time: "",
        difficulty: "Easy",
        meal_plan_id: "",
      });
      setIsCreateRecipeOpen(false);
      fetchRecipes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create recipe",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRecipe(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You've been logged out successfully.",
      });
      navigate("/");
    }
  };

  // Default recipe suggestions
  const defaultRecipes = [
    {
      id: "default-1",
      name: "High-Protein Breakfast Bowl",
      description: "Greek yogurt, granola, berries, and honey",
      calories: 420,
      protein: 28,
      carbs: 52,
      fats: 12,
      time: "10 min",
      difficulty: "Easy",
    },
    {
      id: "default-2",
      name: "Mediterranean Grilled Chicken",
      description: "Chicken breast with quinoa and roasted vegetables",
      calories: 520,
      protein: 45,
      carbs: 48,
      fats: 16,
      time: "25 min",
      difficulty: "Medium",
    },
    {
      id: "default-3",
      name: "Salmon & Sweet Potato",
      description: "Pan-seared salmon with baked sweet potato and asparagus",
      calories: 480,
      protein: 38,
      carbs: 42,
      fats: 18,
      time: "30 min",
      difficulty: "Medium",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Apple className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Eats'Kale</span>
            </Link>
            <nav className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/goals">
                <Button variant="ghost">Goals</Button>
              </Link>
              <Link to="/meals">
                <Button variant="ghost">Meal Plans</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-primary" />
              Meal Plans & Recipes
            </h1>
            <p className="text-muted-foreground">Organize your meals with custom plans</p>
          </div>
          <div className="flex gap-2">
            {/* Create Recipe Button */}
            <Dialog open={isCreateRecipeOpen} onOpenChange={setIsCreateRecipeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Recipe
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Recipe</DialogTitle>
                  <DialogDescription>
                    Add a custom recipe to your collection
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="recipe-name">Recipe Name *</Label>
                    <Input
                      id="recipe-name"
                      placeholder="E.g., Chicken Stir Fry"
                      value={newRecipe.name}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipe-description">Description</Label>
                    <Textarea
                      id="recipe-description"
                      placeholder="Describe your recipe..."
                      value={newRecipe.description}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="recipe-calories">Calories</Label>
                      <Input
                        id="recipe-calories"
                        type="number"
                        placeholder="500"
                        value={newRecipe.calories}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, calories: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipe-protein">Protein (g)</Label>
                      <Input
                        id="recipe-protein"
                        type="number"
                        placeholder="30"
                        value={newRecipe.protein}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, protein: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipe-carbs">Carbs (g)</Label>
                      <Input
                        id="recipe-carbs"
                        type="number"
                        placeholder="50"
                        value={newRecipe.carbs}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, carbs: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipe-fats">Fats (g)</Label>
                      <Input
                        id="recipe-fats"
                        type="number"
                        placeholder="15"
                        value={newRecipe.fats}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, fats: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="recipe-time">Prep Time</Label>
                      <Input
                        id="recipe-time"
                        placeholder="20 min"
                        value={newRecipe.time}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipe-difficulty">Difficulty</Label>
                      <Select 
                        value={newRecipe.difficulty} 
                        onValueChange={(val) => setNewRecipe(prev => ({ ...prev, difficulty: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {mealPlans.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="recipe-plan">Add to Meal Plan (Optional)</Label>
                      <Select 
                        value={newRecipe.meal_plan_id} 
                        onValueChange={(val) => setNewRecipe(prev => ({ ...prev, meal_plan_id: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a meal plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {mealPlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button onClick={handleCreateRecipe} disabled={isCreatingRecipe} className="w-full">
                    {isCreatingRecipe ? "Creating..." : "Create Recipe"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Meal Plan Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Meal Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Meal Plan</DialogTitle>
                  <DialogDescription>
                    Create a custom meal plan to organize your recipes
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-name">Plan Name</Label>
                    <Input
                      id="plan-name"
                      placeholder="E.g., Weekly Meal Prep"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-description">Description (Optional)</Label>
                    <Textarea
                      id="plan-description"
                      placeholder="Describe your meal plan..."
                      value={newPlanDescription}
                      onChange={(e) => setNewPlanDescription(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreatePlan} disabled={isCreatingPlan} className="w-full">
                    {isCreatingPlan ? "Creating..." : "Create Plan"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Meal Plans Section */}
        {mealPlans.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Your Meal Plans</h2>
            <div className="grid gap-6">
              {mealPlans.map((plan) => {
                const planRecipes = recipes.filter(r => r.meal_plan_id === plan.id);
                return (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{plan.name}</CardTitle>
                          {plan.description && (
                            <CardDescription className="mt-2">{plan.description}</CardDescription>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {planRecipes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recipes added yet</p>
                      ) : (
                        <div className="space-y-3">
                          {planRecipes.map((recipe) => (
                            <div key={recipe.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">{recipe.name}</h4>
                                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                  <span>{recipe.calories} cal</span>
                                  <span>P: {recipe.protein}g</span>
                                  <span>C: {recipe.carbs}g</span>
                                  <span>F: {recipe.fats}g</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromPlan(recipe.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Recipe Generator */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-primary">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  AI Recipe Suggestions
                </h3>
                <p className="text-muted-foreground mb-4">
                  {userGoals 
                    ? `Get personalized recipes for your ${userGoals.goal_type === 'lose' ? 'weight loss' : userGoals.goal_type === 'gain' ? 'muscle gain' : 'maintenance'} goal (${userGoals.calories} cal target)`
                    : "Set your nutrition goals to get personalized recipe suggestions!"}
                </p>
                <Button 
                  onClick={getAISuggestions} 
                  disabled={isLoadingSuggestions || !userGoals}
                  className="gap-2"
                >
                  {isLoadingSuggestions ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get Recipes for My Goals
                    </>
                  )}
                </Button>
                {!userGoals && (
                  <Link to="/goals">
                    <Button variant="link" className="ml-2">Set Goals →</Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Suggested Recipes */}
        {suggestedRecipes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              AI-Generated Recipes for You
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {suggestedRecipes.map((recipe, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{recipe.name}</CardTitle>
                        <CardDescription>{recipe.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {recipe.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-muted">
                      <div className="text-center">
                        <div className="text-sm font-bold text-foreground">{recipe.calories}</div>
                        <div className="text-xs text-muted-foreground">Cal</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-secondary">{recipe.protein}g</div>
                        <div className="text-xs text-muted-foreground">P</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-accent">{recipe.carbs}g</div>
                        <div className="text-xs text-muted-foreground">C</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-warning">{recipe.fats}g</div>
                        <div className="text-xs text-muted-foreground">F</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{recipe.time}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => setViewingSuggestedRecipe(recipe)}
                      >
                        View Steps
                      </Button>
                      <Button 
                        className="flex-1 gap-2" 
                        onClick={() => addSuggestedRecipe(recipe)}
                      >
                        <Plus className="h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* View Suggested Recipe Dialog */}
        <Dialog open={!!viewingSuggestedRecipe} onOpenChange={(open) => !open && setViewingSuggestedRecipe(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            {viewingSuggestedRecipe && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{viewingSuggestedRecipe.name}</DialogTitle>
                  <DialogDescription>{viewingSuggestedRecipe.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Nutrition Info */}
                  <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-muted">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{viewingSuggestedRecipe.calories}</div>
                      <div className="text-xs text-muted-foreground">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-secondary">{viewingSuggestedRecipe.protein}g</div>
                      <div className="text-xs text-muted-foreground">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-accent">{viewingSuggestedRecipe.carbs}g</div>
                      <div className="text-xs text-muted-foreground">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-warning">{viewingSuggestedRecipe.fats}g</div>
                      <div className="text-xs text-muted-foreground">Fats</div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  {viewingSuggestedRecipe.ingredients && viewingSuggestedRecipe.ingredients.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Ingredients</h4>
                      <ul className="space-y-1">
                        {viewingSuggestedRecipe.ingredients.map((ingredient, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary">•</span>
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Steps */}
                  {viewingSuggestedRecipe.steps && viewingSuggestedRecipe.steps.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Instructions</h4>
                      <ol className="space-y-3">
                        {viewingSuggestedRecipe.steps.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                              {idx + 1}
                            </span>
                            <span className="text-muted-foreground pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <Button 
                    className="w-full gap-2" 
                    onClick={() => {
                      addSuggestedRecipe(viewingSuggestedRecipe);
                      setViewingSuggestedRecipe(null);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Save Recipe
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Saved Recipes Section */}
        {recipes.filter(r => !r.meal_plan_id).length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              Your Saved Recipes
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recipes.filter(r => !r.meal_plan_id).map((recipe) => (
                <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{recipe.name}</CardTitle>
                        {recipe.description && (
                          <CardDescription>{recipe.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {recipe.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-muted">
                      <div className="text-center">
                        <div className="text-sm font-bold text-foreground">{recipe.calories}</div>
                        <div className="text-xs text-muted-foreground">Cal</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-secondary">{recipe.protein}g</div>
                        <div className="text-xs text-muted-foreground">P</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-accent">{recipe.carbs}g</div>
                        <div className="text-xs text-muted-foreground">C</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-warning">{recipe.fats}g</div>
                        <div className="text-xs text-muted-foreground">F</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{recipe.time}</span>
                    </div>
                    <div className="flex gap-2">
                      {(recipe.ingredients || recipe.steps) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingSavedRecipe(recipe)}
                          className="gap-1"
                        >
                          <ChefHat className="h-4 w-4" />
                          View Steps
                        </Button>
                      )}
                      {mealPlans.length > 0 && (
                        <Select onValueChange={(planId) => {
                          supabase
                            .from("recipes")
                            .update({ meal_plan_id: planId })
                            .eq("id", recipe.id)
                            .then(({ error }) => {
                              if (error) {
                                toast({ title: "Error", description: "Failed to add to plan", variant: "destructive" });
                              } else {
                                toast({ title: "Added!", description: `Recipe added to meal plan` });
                                fetchRecipes();
                              }
                            });
                        }}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Add to Plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {mealPlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFromPlan(recipe.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Saved Recipe Details Dialog */}
        <Dialog open={!!viewingSavedRecipe} onOpenChange={(open) => !open && setViewingSavedRecipe(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {viewingSavedRecipe && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <DialogTitle className="text-2xl mb-2">{viewingSavedRecipe.name}</DialogTitle>
                      <DialogDescription>{viewingSavedRecipe.description}</DialogDescription>
                    </div>
                    <Badge variant="secondary">{viewingSavedRecipe.difficulty}</Badge>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Time & Nutrition */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{viewingSavedRecipe.time} prep time</span>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-foreground">{viewingSavedRecipe.calories}</div>
                      <div className="text-xs text-muted-foreground">Calories</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-secondary">{viewingSavedRecipe.protein}g</div>
                      <div className="text-xs text-muted-foreground">Protein</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-accent">{viewingSavedRecipe.carbs}g</div>
                      <div className="text-xs text-muted-foreground">Carbs</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-warning">{viewingSavedRecipe.fats}g</div>
                      <div className="text-xs text-muted-foreground">Fats</div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  {viewingSavedRecipe.ingredients && viewingSavedRecipe.ingredients.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Apple className="h-5 w-5 text-primary" />
                        Ingredients
                      </h3>
                      <ul className="space-y-2">
                        {viewingSavedRecipe.ingredients.map((ingredient: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Steps */}
                  {viewingSavedRecipe.steps && viewingSavedRecipe.steps.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-primary" />
                        Instructions
                      </h3>
                      <ol className="space-y-3">
                        {viewingSavedRecipe.steps.map((step: string, index: number) => (
                          <li key={index} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* No details message */}
                  {(!viewingSavedRecipe.ingredients || viewingSavedRecipe.ingredients.length === 0) &&
                   (!viewingSavedRecipe.steps || viewingSavedRecipe.steps.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No detailed instructions available for this recipe.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Recipe Grid */}
        <h2 className="text-2xl font-bold text-foreground mb-4">Default Recipes</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {defaultRecipes.map((meal) => (
            <Card key={meal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{meal.name}</CardTitle>
                    <CardDescription>{meal.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {meal.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nutrition Info */}
                <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-muted">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{meal.calories}</div>
                    <div className="text-xs text-muted-foreground">Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary">{meal.protein}g</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-accent">{meal.carbs}g</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-warning">{meal.fats}g</div>
                    <div className="text-xs text-muted-foreground">Fats</div>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{meal.time} prep time</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => handleViewRecipe(meal)}>
                    View Recipe
                  </Button>
                  <Button 
                    variant="outline" 
                    disabled={mealPlans.length === 0}
                    onClick={() => {
                      setSelectedRecipe(meal);
                      setIsRecipeDialogOpen(true);
                    }}
                  >
                    Add to Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Measurement Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Measurement Guide</CardTitle>
            <CardDescription>Common utensil measurements for easy portion tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <MeasurementItem 
                item="1 Cup" 
                equivalent="240ml / 8oz"
                examples="Rice, vegetables, liquids"
              />
              <MeasurementItem 
                item="1 Tablespoon" 
                equivalent="15ml / 0.5oz"
                examples="Oils, sauces, nut butter"
              />
              <MeasurementItem 
                item="1 Teaspoon" 
                equivalent="5ml"
                examples="Spices, sugar, salt"
              />
              <MeasurementItem 
                item="Palm-sized" 
                equivalent="~3-4oz / 85-115g"
                examples="Meat, fish, protein"
              />
              <MeasurementItem 
                item="Fist-sized" 
                equivalent="~1 cup"
                examples="Fruits, vegetables"
              />
              <MeasurementItem 
                item="Thumb-sized" 
                equivalent="~1oz / 28g"
                examples="Cheese, nuts, butter"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipe Dialog */}
      <RecipeDialog
        recipe={selectedRecipe}
        open={isRecipeDialogOpen}
        onOpenChange={setIsRecipeDialogOpen}
        mealPlans={mealPlans}
        onAddToPlan={handleAddToPlan}
      />
    </div>
  );
};

const MeasurementItem = ({ item, equivalent, examples }: { item: string; equivalent: string; examples: string }) => {
  return (
    <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <h4 className="font-semibold text-foreground mb-1">{item}</h4>
      <p className="text-sm text-primary mb-1">{equivalent}</p>
      <p className="text-xs text-muted-foreground">{examples}</p>
    </div>
  );
};

export default Meals;