import { useState, useRef } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  foodName: string;
}

interface MealScannerProps {
  onScanComplete?: (data: NutritionData) => void;
}

export const MealScanner = ({ onScanComplete }: MealScannerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Analyze image
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Convert image to base64 for AI analysis
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Call AI to analyze the meal
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze meal');
      }

      const data = await response.json();
      setNutritionData(data);
      
      if (onScanComplete) {
        onScanComplete(data);
      }

      toast({
        title: "Meal analyzed!",
        description: `${data.foodName} detected with nutritional information.`,
      });
    } catch (error) {
      console.error('Error analyzing meal:', error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Scan Your Meal</h3>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {!previewUrl ? (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={triggerFileInput}
              className="flex-1"
              variant="default"
              disabled={isAnalyzing}
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
            <Button
              onClick={triggerFileInput}
              className="flex-1"
              variant="outline"
              disabled={isAnalyzing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="Meal preview"
              className="w-full h-48 object-cover"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>

          {nutritionData && !isAnalyzing && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-lg">{nutritionData.foodName}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Calories:</span>
                  <span className="ml-2 font-semibold">{nutritionData.calories} kcal</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Protein:</span>
                  <span className="ml-2 font-semibold">{nutritionData.protein}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Carbs:</span>
                  <span className="ml-2 font-semibold">{nutritionData.carbs}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fats:</span>
                  <span className="ml-2 font-semibold">{nutritionData.fats}g</span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              setPreviewUrl(null);
              setNutritionData(null);
            }}
            variant="outline"
            className="w-full"
          >
            Scan Another Meal
          </Button>
        </div>
      )}
    </Card>
  );
};
