import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Apple, Camera, Plus, Target, TrendingUp, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [foodInput, setFoodInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Mock data - will be replaced with real data from database
  const dailyGoals = {
    calories: { current: 1450, target: 2000 },
    protein: { current: 65, target: 150 },
    carbs: { current: 180, target: 250 },
    fats: { current: 45, target: 70 },
  };

  const todaysMeals = [
    { id: 1, name: "Oatmeal with Berries", time: "8:30 AM", calories: 350, protein: 12, carbs: 65, fats: 8 },
    { id: 2, name: "Grilled Chicken Salad", time: "1:00 PM", calories: 450, protein: 35, carbs: 30, fats: 18 },
    { id: 3, name: "Greek Yogurt & Almonds", time: "4:00 PM", calories: 250, protein: 18, carbs: 20, fats: 12 },
  ];

  const handleAnalyzeFood = async () => {
    if (!foodInput.trim()) {
      toast({
        title: "Please describe your meal",
        description: "Enter what you ate so we can analyze it",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    // TODO: Call AI API to analyze food
    setTimeout(() => {
      toast({
        title: "Meal analyzed!",
        description: "Nutritional information has been added to your log",
      });
      setFoodInput("");
      setIsAnalyzing(false);
    }, 2000);
  };

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
              <span className="text-xl font-bold text-foreground">NutriTrack AI</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/goals">
                <Button variant="ghost">Goals</Button>
              </Link>
              <Link to="/meals">
                <Button variant="ghost">Meal Plans</Button>
              </Link>
              <Button variant="outline">Sign Out</Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Track your meals and reach your nutrition goals</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Meal Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Log Your Meal
                </CardTitle>
                <CardDescription>Describe what you ate or upload a photo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="E.g., 2 scrambled eggs, 2 slices of whole wheat toast with butter, a cup of coffee"
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAnalyzeFood} disabled={isAnalyzing} className="flex-1">
                    {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Today's Meals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Today's Meals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysMeals.map((meal) => (
                    <div key={meal.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <h4 className="font-semibold text-foreground">{meal.name}</h4>
                        <p className="text-sm text-muted-foreground">{meal.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{meal.calories} cal</p>
                        <p className="text-xs text-muted-foreground">
                          P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Daily Summary */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Daily Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <NutrientProgress
                  label="Calories"
                  current={dailyGoals.calories.current}
                  target={dailyGoals.calories.target}
                  unit="kcal"
                  color="primary"
                />
                <NutrientProgress
                  label="Protein"
                  current={dailyGoals.protein.current}
                  target={dailyGoals.protein.target}
                  unit="g"
                  color="secondary"
                />
                <NutrientProgress
                  label="Carbs"
                  current={dailyGoals.carbs.current}
                  target={dailyGoals.carbs.target}
                  unit="g"
                  color="accent"
                />
                <NutrientProgress
                  label="Fats"
                  current={dailyGoals.fats.current}
                  target={dailyGoals.fats.target}
                  unit="g"
                  color="warning"
                />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-accent text-white border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/80">Avg. Calories</span>
                    <span className="font-semibold">1,850</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Days Logged</span>
                    <span className="font-semibold">6/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Goal Streak</span>
                    <span className="font-semibold">4 days 🔥</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const NutrientProgress = ({ 
  label, 
  current, 
  target, 
  unit, 
  color 
}: { 
  label: string; 
  current: number; 
  target: number; 
  unit: string; 
  color: string;
}) => {
  const percentage = (current / target) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {current} / {target} {unit}
        </span>
      </div>
      <Progress value={percentage} className={`h-2 bg-${color}/20`} />
    </div>
  );
};

export default Dashboard;
