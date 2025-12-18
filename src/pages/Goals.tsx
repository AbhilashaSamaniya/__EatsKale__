import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Apple, Target, Save, LogOut, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Goals = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [goalType, setGoalType] = useState("maintain");
  const [calories, setCalories] = useState("2000");
  const [protein, setProtein] = useState("150");
  const [carbs, setCarbs] = useState("250");
  const [fats, setFats] = useState("70");
  const [loading, setLoading] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setGoalType(data.goal_type);
        setCalories(data.calories.toString());
        setProtein(data.protein.toString());
        setCarbs(data.carbs.toString());
        setFats(data.fats.toString());
      }
    } catch (error: any) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
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

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user already has goals
      const { data: existingGoals } = await supabase
        .from("goals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let error;
      if (existingGoals?.id) {
        // Update existing goals - don't include user_id in update
        const result = await supabase
          .from("goals")
          .update({
            goal_type: goalType,
            calories: parseInt(calories),
            protein: parseInt(protein),
            carbs: parseInt(carbs),
            fats: parseInt(fats),
          })
          .eq("id", existingGoals.id);
        error = result.error;
      } else {
        // Insert new goals
        const result = await supabase
          .from("goals")
          .insert({
            user_id: user.id,
            goal_type: goalType,
            calories: parseInt(calories),
            protein: parseInt(protein),
            carbs: parseInt(carbs),
            fats: parseInt(fats),
          });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Goals updated!",
        description: "Your nutrition goals have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save goals",
        variant: "destructive",
      });
    }
  };

  const getAIRecommendation = async (detailed: boolean = false) => {
    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('goal-recommendations', {
        body: {
          goalType,
          currentCalories: parseInt(calories),
          currentProtein: parseInt(protein),
          currentCarbs: parseInt(carbs),
          currentFats: parseInt(fats),
          detailed
        }
      });

      if (error) throw error;

      setAiRecommendation(data.recommendation);
      if (detailed) {
        setIsRecommendationOpen(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const applyRecommendation = async () => {
    await getAIRecommendation(false);
    // The brief recommendation would suggest specific values
    // For now, we'll use preset recommendations
    const recommendations = {
      lose: { calories: "1800", protein: "150", carbs: "180", fats: "60" },
      maintain: { calories: "2200", protein: "140", carbs: "250", fats: "73" },
      gain: { calories: "2600", protein: "180", carbs: "300", fats: "72" }
    };
    
    const rec = recommendations[goalType as keyof typeof recommendations];
    setCalories(rec.calories);
    setProtein(rec.protein);
    setCarbs(rec.carbs);
    setFats(rec.fats);
    
    toast({
      title: "Applied!",
      description: "Recommended values have been applied to your goals.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Nutrition Goals
          </h1>
          <p className="text-muted-foreground">Set your daily targets and let AI help you achieve them</p>
        </div>

        <div className="space-y-6">
          {/* Goal Type */}
          <Card>
            <CardHeader>
              <CardTitle>Your Goal</CardTitle>
              <CardDescription>What are you trying to achieve?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goalType">Goal Type</Label>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger id="goalType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="gain">Gain Muscle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Macro Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Targets</CardTitle>
              <CardDescription>Customize your calorie and macronutrient goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbohydrates (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fats">Fats (g)</Label>
                  <Input
                    id="fats"
                    type="number"
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Goals
              </Button>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI Recommendations</CardTitle>
              </div>
              <CardDescription>Based on your goal: {goalType === "lose" ? "Lose Weight" : goalType === "maintain" ? "Maintain Weight" : "Gain Muscle"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-card border border-border">
                  <h4 className="font-semibold mb-2 text-foreground">Recommended Calorie Intake</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {goalType === "lose" 
                      ? "For weight loss, aim for a moderate calorie deficit of 300-500 calories below maintenance."
                      : goalType === "maintain"
                      ? "To maintain weight, consume calories equal to your daily energy expenditure."
                      : "For muscle gain, aim for a slight surplus of 200-400 calories above maintenance."
                    }
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={applyRecommendation} disabled={isLoadingAI}>
                      Use Recommended
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => getAIRecommendation(true)} disabled={isLoadingAI}>
                      {isLoadingAI ? "Loading..." : "Tell me more"}
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-card border border-border">
                  <h4 className="font-semibold mb-2 text-foreground">Macro Balance</h4>
                  <p className="text-sm text-muted-foreground">
                    {goalType === "lose" 
                      ? "Higher protein (30%), moderate carbs (40%), moderate fats (30%)"
                      : goalType === "maintain"
                      ? "Balanced split: protein (25%), carbs (45%), fats (30%)"
                      : "High protein (30%), high carbs (45%), moderate fats (25%)"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Recommendation Detail Dialog */}
      <Dialog open={isRecommendationOpen} onOpenChange={setIsRecommendationOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Detailed AI Recommendations
            </DialogTitle>
            <DialogDescription>
              Personalized nutrition guidance for your {goalType === "lose" ? "weight loss" : goalType === "maintain" ? "weight maintenance" : "muscle gain"} goal
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-foreground">
              {aiRecommendation || "Loading recommendations..."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
