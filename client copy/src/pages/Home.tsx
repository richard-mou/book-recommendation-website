import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Sparkles, Book, Film, Music, Tv, X, Loader2, History, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type MediaType = "books" | "movies" | "songs" | "tv_shows" | "all";

type Recommendation = {
  title: string;
  type: "book" | "movie" | "song" | "tv_show";
  creator: string;
  year: string;
  description: string;
};

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  const [currentInput, setCurrentInput] = useState("");
  const [favoriteMedia, setFavoriteMedia] = useState<string[]>([]);
  const [themes, setThemes] = useState("");
  const [plots, setPlots] = useState("");
  const [genres, setGenres] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<MediaType[]>(["all"]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  const generateMutation = trpc.recommendations.generate.useMutation({
    onSuccess: (data) => {
      setRecommendations(data);
      toast.success("Recommendations generated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate recommendations");
    },
  });
  
  const handleAddFavorite = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentInput.trim()) {
      e.preventDefault();
      if (!favoriteMedia.includes(currentInput.trim())) {
        setFavoriteMedia([...favoriteMedia, currentInput.trim()]);
      }
      setCurrentInput("");
    }
  };
  
  const removeFavorite = (item: string) => {
    setFavoriteMedia(favoriteMedia.filter((m) => m !== item));
  };
  
  const toggleMediaType = (type: MediaType) => {
    if (type === "all") {
      setSelectedTypes(["all"]);
    } else {
      const filtered = selectedTypes.filter((t) => t !== "all");
      if (filtered.includes(type)) {
        const newTypes = filtered.filter((t) => t !== type);
        setSelectedTypes(newTypes.length === 0 ? ["all"] : newTypes);
      } else {
        setSelectedTypes([...filtered, type]);
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (favoriteMedia.length === 0) {
      toast.error("Please add at least one favorite media item");
      return;
    }
    
    generateMutation.mutate({
      favoriteMedia,
      themes: themes.trim() || undefined,
      plots: plots.trim() || undefined,
      genres: genres.trim() || undefined,
      mediaTypes: selectedTypes,
    });
  };
  
  const getMediaIcon = (type: string) => {
    switch (type) {
      case "book":
        return <Book className="w-4 h-4" />;
      case "movie":
        return <Film className="w-4 h-4" />;
      case "song":
        return <Music className="w-4 h-4" />;
      case "tv_show":
        return <Tv className="w-4 h-4" />;
      default:
        return null;
    }
  };
  
  const getMediaTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      book: "Book",
      movie: "Movie",
      song: "Song",
      tv_show: "TV Show",
    };
    return labels[type] || type;
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Discover Your Next
              <span className="block text-primary mt-2">Favorite Media</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get personalized recommendations for books, movies, songs, and TV shows powered by advanced AI technology.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg px-8" asChild>
                <a href={getLoginUrl()}>Get Started</a>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-3xl mx-auto">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Book className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Books</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Film className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Movies</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Songs</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tv className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium">TV Shows</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">AI Media Recommender</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/history")}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold">
              Welcome back, {user?.name || "there"}!
            </h2>
            <p className="text-muted-foreground text-lg">
              Tell us what you love, and we'll find your next favorite
            </p>
          </div>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Your Preferences</CardTitle>
              <CardDescription>
                Share your favorite media and preferences to get personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="favorites">Favorite Books, Movies, Songs, or TV Shows</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="favorites"
                      placeholder="Type a title and press Enter to add..."
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={handleAddFavorite}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        if (currentInput.trim()) {
                          setFavoriteMedia([...favoriteMedia, currentInput.trim()]);
                          setCurrentInput("");
                        }
                      }}
                      className="shrink-0"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </Button>
                  </div>
                  {favoriteMedia.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {favoriteMedia.map((item) => (
                        <Badge
                          key={item}
                          variant="secondary"
                          className="pl-3 pr-2 py-1.5 text-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeFavorite(item)}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label>What type of recommendations do you want?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { value: "all" as MediaType, label: "All Types", icon: Sparkles },
                      { value: "books" as MediaType, label: "Books", icon: Book },
                      { value: "movies" as MediaType, label: "Movies", icon: Film },
                      { value: "songs" as MediaType, label: "Songs", icon: Music },
                      { value: "tv_shows" as MediaType, label: "TV Shows", icon: Tv },
                    ].map(({ value, label, icon: Icon }) => (
                      <div
                        key={value}
                        className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTypes.includes(value)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => toggleMediaType(value)}
                      >
                        <Checkbox
                          id={value}
                          checked={selectedTypes.includes(value)}
                          onCheckedChange={() => toggleMediaType(value)}
                        />
                        <Label
                          htmlFor={value}
                          className="flex items-center space-x-2 cursor-pointer flex-1"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{label}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="themes">Themes (Optional)</Label>
                    <Textarea
                      id="themes"
                      placeholder="e.g., adventure, romance, mystery..."
                      value={themes}
                      onChange={(e) => setThemes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plots">Plot Preferences (Optional)</Label>
                    <Textarea
                      id="plots"
                      placeholder="e.g., character-driven, plot twists..."
                      value={plots}
                      onChange={(e) => setPlots(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genres">Genres (Optional)</Label>
                    <Textarea
                      id="genres"
                      placeholder="e.g., sci-fi, thriller, comedy..."
                      value={genres}
                      onChange={(e) => setGenres(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={generateMutation.isPending || favoriteMedia.length === 0}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Recommendations...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Recommendations
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {recommendations.length > 0 && (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-center">Your Personalized Recommendations</h3>
              
              {/* Group recommendations by type */}
              {['book', 'movie', 'tv_show', 'song'].map(mediaType => {
                const filteredRecs = recommendations.filter(rec => rec.type === mediaType);
                if (filteredRecs.length === 0) return null;
                
                return (
                  <div key={mediaType} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getMediaIcon(mediaType)}</span>
                      <h4 className="text-xl font-semibold">{getMediaTypeLabel(mediaType)}</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredRecs.map((rec, index) => {
                        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(rec.title + ' ' + rec.creator)}`;
                        return (
                          <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-xl">{rec.title}</CardTitle>
                                  <CardDescription className="mt-1">
                                    {rec.creator} • {rec.year}
                                  </CardDescription>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                  <span className="mr-1">{getMediaIcon(rec.type)}</span>
                                  {getMediaTypeLabel(rec.type)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {rec.description}
                              </p>
                              <a 
                                href={googleSearchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-primary hover:underline"
                              >
                                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                                </svg>
                                Search on Google
                              </a>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
