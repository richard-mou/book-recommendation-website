import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Sparkles, Book, Film, Music, Tv, Loader2, ArrowLeft, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";

type Recommendation = {
  title: string;
  type: "book" | "movie" | "song" | "tv_show";
  creator: string;
  year: string;
  description: string;
};

type HistoryItem = {
  id: number;
  favoriteMedia: string[];
  themes: string | null;
  plots: string | null;
  genres: string | null;
  mediaTypes: string[];
  results: Recommendation[];
  createdAt: Date;
};

export default function History() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: history, isLoading } = trpc.recommendations.history.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
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
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">AI Media Recommender</h1>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold">
              Your Recommendation History
            </h2>
            <p className="text-muted-foreground text-lg">
              Review your past recommendations and preferences
            </p>
          </div>
          
          {!history || history.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't generated any recommendations yet. Start by sharing your preferences!
                </p>
                <Button onClick={() => setLocation("/")}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Recommendations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {history.map((item: HistoryItem) => (
                <Card key={item.id} className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          Recommendation Session
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(item.createdAt), "PPpp")}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="pt-4 space-y-2">
                      <div>
                        <span className="text-sm font-medium">Your Favorites: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.favoriteMedia.map((media, idx) => (
                            <Badge key={idx} variant="secondary">
                              {media}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {(item.themes || item.plots || item.genres) && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          {item.themes && <div><strong>Themes:</strong> {item.themes}</div>}
                          {item.plots && <div><strong>Plots:</strong> {item.plots}</div>}
                          {item.genres && <div><strong>Genres:</strong> {item.genres}</div>}
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm font-medium">Requested Types: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.mediaTypes.map((type, idx) => (
                            <Badge key={idx} variant="outline">
                              {type === "all" ? "All Types" : type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <h4 className="font-semibold mb-3">Recommendations:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {item.results.map((rec: Recommendation, idx: number) => (
                        <Card key={idx} className="bg-muted/30">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base">{rec.title}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {rec.creator} • {rec.year}
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="ml-2 text-xs">
                                <span className="mr-1">{getMediaIcon(rec.type)}</span>
                                {getMediaTypeLabel(rec.type)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-2">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {rec.description}
                            </p>
                            <a 
                              href={`https://www.google.com/search?q=${encodeURIComponent(rec.title + ' ' + rec.creator)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-primary hover:underline"
                            >
                              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                              </svg>
                              Search on Google
                            </a>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
