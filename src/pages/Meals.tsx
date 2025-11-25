import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, ChefHat, Clock, Sparkles, LogOut, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RecipeDialog } from "@/components/RecipeDialog";

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

  useEffect(() => {
    fetchMealPlans();
    fetchRecipes();
  }, []);

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

        {/* AI Banner */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-primary">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Recipe Suggestions
                </h3>
                <p className="text-muted-foreground mb-4">
                  Browse our recommended recipes below. Create meal plans to organize your favorite recipes!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipe Grid */}
        <h2 className="text-2xl font-bold text-foreground mb-4">Suggested Recipes</h2>
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