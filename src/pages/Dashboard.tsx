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
import { DailyQuote } from "@/components/DailyQuote";
import { ProgressAnalytics } from "@/components/ProgressAnalytics";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useActivityTracking } from "@/hooks/useActivityTracking";

const Dashboard = () => {
  const [foodInput, setFoodInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userName, setUserName] = useState("");
  const [meals, setMeals] = useState<any[]>([]);
  const [weeklyMeals, setWeeklyMeals] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    avgCalories: 0,
    daysLogged: 0,
    goalStreak: 0,
  });
  const [dailyGoals, setDailyGoals] = useState({
    calories: { current: 0, target: 2000 },
    protein: { current: 0, target: 150 },
    carbs: { current: 0, target: 250 },
    fats: { current: 0, target: 70 },
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  usePushNotifications();
  useActivityTracking();

  useEffect(() => {
    fetchUserProfile();
    fetchGoals();
    fetchTodaysMeals();
    fetchWeeklyMeals();
  }, []);

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

  const fetchGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setDailyGoals({
        calories: { current: dailyGoals.calories.current, target: data.calories },
        protein: { current: dailyGoals.protein.current, target: data.protein },
        carbs: { current: dailyGoals.carbs.current, target: data.carbs },
        fats: { current: dailyGoals.fats.current, target: data.fats },
      });
    }
  };

  const fetchTodaysMeals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("meal_date", today.toISOString())
      .order("meal_date", { ascending: false });

    if (error) {
      console.error("Error fetching meals:", error);
      return;
    }

    if (data) {
      setMeals(data);
      
      // Calculate totals
      const totals = data.reduce(
        (acc, meal) => ({
          calories: acc.calories + Number(meal.calories),
          protein: acc.protein + Number(meal.protein),
          carbs: acc.carbs + Number(meal.carbs),
          fats: acc.fats + Number(meal.fats),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      setDailyGoals(prev => ({
        calories: { current: totals.calories, target: prev.calories.target },
        protein: { current: totals.protein, target: prev.protein.target },
        carbs: { current: totals.carbs, target: prev.carbs.target },
        fats: { current: totals.fats, target: prev.fats.target },
      }));
    }
  };

  const fetchWeeklyMeals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("meal_date", weekAgo.toISOString())
      .order("meal_date", { ascending: false });

    if (error) {
      console.error("Error fetching weekly meals:", error);
      return;
    }

    if (data) {
      setWeeklyMeals(data);
      
      // Calculate weekly stats
      const mealsByDay = data.reduce((acc: Record<string, any[]>, meal) => {
        const date = new Date(meal.meal_date).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(meal);
        return acc;
      }, {});

      const daysLogged = Object.keys(mealsByDay).length;
      
      const totalCalories = data.reduce((sum, meal) => sum + Number(meal.calories), 0);
      const avgCalories = daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0;

      // Calculate goal streak (consecutive days meeting calorie goal)
      const today = new Date();
      let streak = 0;
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toDateString();
        const dayMeals = mealsByDay[dateStr] || [];
        const dayCalories = dayMeals.reduce((sum: number, m: any) => sum + Number(m.calories), 0);
        
        if (dayCalories >= dailyGoals.calories.target * 0.8 && dayCalories <= dailyGoals.calories.target * 1.2) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      setWeeklyStats({
        avgCalories,
        daysLogged,
        goalStreak: streak,
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
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-meal', {
        body: { description: foodInput }
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error: insertError } = await supabase
        .from("meals")
        .insert([{
          user_id: user.id,
          meal_name: data.foodName,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fats: data.fats,
          meal_date: new Date().toISOString(),
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Meal analyzed!",
        description: `${data.foodName} added to your meals`,
      });
      
      setFoodInput("");
      fetchTodaysMeals();
      fetchWeeklyMeals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze meal",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMealScanned = async (nutritionData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let imageUrl = null;

      // Upload image to storage if provided
      if (nutritionData.image) {
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const imageBlob = await fetch(nutritionData.image).then(r => r.blob());
        
        const { error: uploadError } = await supabase.storage
          .from('meal-images')
          .upload(fileName, imageBlob, {
            contentType: 'image/jpeg',
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('meal-images')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from("meals")
        .insert([{
          user_id: user.id,
          meal_name: nutritionData.foodName,
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fats: nutritionData.fats,
          image_url: imageUrl,
          meal_date: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Meal logged!",
        description: `${nutritionData.foodName} added to your meals`,
      });

      fetchTodaysMeals();
      fetchWeeklyMeals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log meal",
        variant: "destructive",
      });
    }
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
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back{userName ? `, ${userName}` : ""}!
            </h1>
            <p className="text-muted-foreground">Track your meals and reach your nutrition goals</p>
          </div>
          <DailyQuote />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meal Scanner */}
            <MealScanner onScanComplete={handleMealScanned} />
            
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
                  {meals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No meals logged today. Start by scanning or logging a meal!
                    </p>
                  ) : (
                    meals.map((meal) => (
                      <div key={meal.id} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        {meal.image_url && (
                          <img 
                            src={meal.image_url} 
                            alt={meal.meal_name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{meal.meal_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(meal.meal_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{meal.calories} cal</p>
                          <p className="text-xs text-muted-foreground">
                            P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <ProgressAnalytics />

            {/* Weekly Meal History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  This Week's Portions
                </CardTitle>
                <CardDescription>Your meal history for the past 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyMeals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No meals logged this week yet.
                    </p>
                  ) : (
                    Object.entries(
                      weeklyMeals.reduce((acc: Record<string, any[]>, meal) => {
                        const date = new Date(meal.meal_date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(meal);
                        return acc;
                      }, {})
                    ).map(([date, dayMeals]) => {
                      const dayTotal = (dayMeals as any[]).reduce((sum, m) => sum + Number(m.calories), 0);
                      return (
                        <div key={date} className="border border-border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-foreground">{date}</h4>
                            <span className="text-sm font-medium text-primary">{dayTotal} cal total</span>
                          </div>
                          <div className="space-y-2">
                            {(dayMeals as any[]).map((meal) => (
                              <div key={meal.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                                <div className="flex items-center gap-2">
                                  {meal.image_url && (
                                    <img 
                                      src={meal.image_url} 
                                      alt={meal.meal_name}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <span className="font-medium text-foreground">{meal.meal_name}</span>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(meal.meal_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-medium">{meal.calories} cal</span>
                                  <p className="text-xs text-muted-foreground">
                                    P:{meal.protein}g C:{meal.carbs}g F:{meal.fats}g
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
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
                    <span className="font-semibold">{weeklyStats.avgCalories.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Days Logged</span>
                    <span className="font-semibold">{weeklyStats.daysLogged}/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Goal Streak</span>
                    <span className="font-semibold">{weeklyStats.goalStreak} days {weeklyStats.goalStreak > 0 ? '🔥' : ''}</span>
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
