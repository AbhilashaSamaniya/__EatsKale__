import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Apple, BarChart3, Brain, Target, Utensils, ChefHat } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Apple className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Eats'Kale
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-primary py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2">
              <Apple className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">AI-Powered Nutrition Tracking</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
              Eats'Kale
            </h1>
            
            <p className="mb-4 text-2xl font-semibold text-white tracking-wide">
              Track • Tweak • Triumph • Hit your nutrition target!
            </p>
            
            <p className="mb-8 max-w-2xl text-lg text-white/90 md:text-xl">
              Snap a photo of your meal and let AI instantly analyze its nutritional content. 
              Achieve your health goals with personalized insights and smart meal planning.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" className="text-lg shadow-lg" asChild>
                <Link to="/auth">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-lg backdrop-blur-sm" asChild>
                <Link to="/dashboard">View Demo</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4 md:text-4xl">
              Everything You Need to Stay Healthy
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to make nutrition tracking effortless and effective
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Brain className="h-8 w-8" />}
              title="AI Food Recognition"
              description="Simply describe your meal or upload a photo. Our AI analyzes and provides complete nutritional information instantly."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Track Your Progress"
              description="Visualize your nutrition intake with beautiful charts and graphs. Monitor calories, macros, and micronutrients effortlessly."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8" />}
              title="Personalized Goals"
              description="Set custom nutrition goals based on your lifestyle. Get real-time feedback on your progress throughout the day."
            />
            <FeatureCard
              icon={<ChefHat className="h-8 w-8" />}
              title="Smart Meal Plans"
              description="Receive AI-generated meal suggestions tailored to your goals and preferences. Complete with recipes and shopping lists."
            />
            <FeatureCard
              icon={<Utensils className="h-8 w-8" />}
              title="Utensil Measurements"
              description="No food scale needed. Our AI understands common measurements like cups, spoons, and portion sizes."
            />
            <FeatureCard
              icon={<Apple className="h-8 w-8" />}
              title="Meal History"
              description="Access your complete meal history anytime. Learn from your patterns and make better food choices."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-muted">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4 md:text-4xl">
            Ready to Transform Your Health?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users who are achieving their nutrition goals with AI-powered tracking
          </p>
          <Button size="lg" className="text-lg shadow-lg" asChild>
            <Link to="/auth">Start Tracking Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>© 2025 Eats'Kale. Track • Tweak • Triumph</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/10">
      <div className="mb-4 inline-flex rounded-xl bg-gradient-primary p-3 text-white shadow-md">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-card-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-primary transition-all duration-300 group-hover:w-full"></div>
    </div>
  );
};

export default Index;
