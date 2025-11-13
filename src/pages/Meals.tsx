import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, ChefHat, Clock, Sparkles, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const Meals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const mealSuggestions = [
    {
      id: 1,
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
      id: 2,
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
      id: 3,
      name: "Salmon & Sweet Potato",
      description: "Pan-seared salmon with baked sweet potato and asparagus",
      calories: 480,
      protein: 38,
      carbs: 42,
      fats: 18,
      time: "30 min",
      difficulty: "Medium",
    },
    {
      id: 4,
      name: "Veggie Stir-Fry Bowl",
      description: "Tofu, mixed vegetables, and brown rice with teriyaki sauce",
      calories: 380,
      protein: 22,
      carbs: 58,
      fats: 10,
      time: "20 min",
      difficulty: "Easy",
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            Meal Plans & Recipes
          </h1>
          <p className="text-muted-foreground">AI-powered meal suggestions tailored to your goals</p>
        </div>

        {/* AI Banner */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-primary">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Personalized Meal Suggestions
                </h3>
                <p className="text-muted-foreground mb-4">
                  These meals are recommended based on your goals and preferences. Click any recipe to view full details, ingredients, and step-by-step instructions.
                </p>
                <Button>Generate New Suggestions</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {mealSuggestions.map((meal) => (
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
                  <Button className="flex-1">View Recipe</Button>
                  <Button variant="outline">Add to Plan</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Utensil Measurements Reference */}
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
