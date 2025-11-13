import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Apple, Camera, Plus, Target, TrendingUp, Utensils, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MealScanner } from "@/components/MealScanner";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [foodInput, setFoodInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userName, setUserName] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.full_name) {
          setUserName(profile.full_name);
        }
      }
    };
    fetchUserProfile();
  }, []);

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

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back{userName ? `, ${userName}` : ""}!
          </h1>
          <p className="text-muted-foreground">Track your meals and reach your nutrition goals</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meal Scanner */}
            <MealScanner onScanComplete={(data) => {
              console.log("Scanned meal:", data);
              toast({
                title: "Meal logged!",
                description: `${data.foodName} added to your meals`,
              });
            }} />
            
            {/* Add Meal Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Or Log Manually
                </CardTitle>
                <CardDescription>Describe what you ate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="E.g., 2 scrambled eggs, 2 slices of whole wheat toast with butter, a cup of coffee"
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAnalyzeFood} disabled={isAnalyzing} className="w-full">
                  {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                </Button>
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
