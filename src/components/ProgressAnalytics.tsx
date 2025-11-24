import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ProgressAnalytics = () => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  const fetchWeeklyData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("meals")
      .select("meal_date, calories, protein, carbs, fats")
      .eq("user_id", user.id)
      .gte("meal_date", sevenDaysAgo.toISOString())
      .order("meal_date", { ascending: true });

    if (error) {
      console.error("Error fetching analytics:", error);
      return;
    }

    // Group by date
    const dailyTotals = data.reduce((acc: any, meal) => {
      const date = new Date(meal.meal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, calories: 0, protein: 0, carbs: 0, fats: 0 };
      }
      acc[date].calories += Number(meal.calories);
      acc[date].protein += Number(meal.protein);
      acc[date].carbs += Number(meal.carbs);
      acc[date].fats += Number(meal.fats);
      return acc;
    }, {});

    setChartData(Object.values(dailyTotals));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          7-Day Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-muted-foreground" />
            <YAxis className="text-muted-foreground" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="calories" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="protein" stroke="hsl(var(--secondary))" strokeWidth={2} />
            <Line type="monotone" dataKey="carbs" stroke="hsl(var(--accent))" strokeWidth={2} />
            <Line type="monotone" dataKey="fats" stroke="hsl(var(--warning))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};