import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface Recipe {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
  difficulty: string;
}

interface RecipeDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealPlans: any[];
  onAddToPlan: (recipeId: string, planId: string) => void;
}

export const RecipeDialog = ({ recipe, open, onOpenChange, mealPlans, onAddToPlan }: RecipeDialogProps) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  if (!recipe) return null;

  const handleAddToPlan = () => {
    if (selectedPlanId) {
      onAddToPlan(recipe.id, selectedPlanId);
      setSelectedPlanId("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{recipe.name}</DialogTitle>
              <DialogDescription>{recipe.description}</DialogDescription>
            </div>
            <Badge variant="secondary">{recipe.difficulty}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{recipe.time} prep time</span>
          </div>

          {/* Nutrition Info */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Nutritional Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{recipe.calories}</div>
                <div className="text-sm text-muted-foreground">Calories</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-secondary">{recipe.protein}g</div>
                <div className="text-sm text-muted-foreground">Protein</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-accent">{recipe.carbs}g</div>
                <div className="text-sm text-muted-foreground">Carbs</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-warning">{recipe.fats}g</div>
                <div className="text-sm text-muted-foreground">Fats</div>
              </div>
            </div>
          </div>

          {/* Add to Plan */}
          {mealPlans.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Add to Meal Plan</h3>
              <div className="flex gap-3">
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger className="flex-1">
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
                <Button onClick={handleAddToPlan} disabled={!selectedPlanId} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          )}

          {mealPlans.length === 0 && (
            <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
              Create a meal plan first to add recipes to it
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};