import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { connectToStreamingAPI } from "./services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Activity, Moon, Sun, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Menu, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BubbleChart } from "./components/BubbleChart";

function CryptoApp() {
  const { t, i18n } = useTranslation();
  const [cryptoData, setCryptoData] = useState([]);
  const [marketStats, setMarketStats] = useState([]);
  const [articles, setArticles] = useState([]);
  const [sentimentAnalysis, setSentimentAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamActive, setStreamActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  const itemsPerPage = 10;

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortedData = () => {
    if (!sortColumn) return cryptoData;

    return [...cryptoData].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'name':
          aValue = a.crypto?.name || '';
          bValue = b.crypto?.name || '';
          break;
        case 'price':
          aValue = parseFloat(a.price_usd) || 0;
          bValue = parseFloat(b.price_usd) || 0;
          break;
        case 'change24h':
          aValue = parseFloat(a.pct_change_24h) || 0;
          bValue = parseFloat(b.pct_change_24h) || 0;
          break;
        case 'change7d':
          aValue = parseFloat(a.pct_change_7d) || 0;
          bValue = parseFloat(b.pct_change_7d) || 0;
          break;
        case 'volume':
          aValue = parseFloat(a.volume_24h_usd) || 0;
          bValue = parseFloat(b.volume_24h_usd) || 0;
          break;
        case 'marketCap':
          aValue = parseFloat(a.market_cap_usd) || 0;
          bValue = parseFloat(b.market_cap_usd) || 0;
          break;
        case 'supply':
          aValue = parseFloat(a.supply_circulating) || 0;
          bValue = parseFloat(b.supply_circulating) || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const cleanup = connectToStreamingAPI(
      (data) => {
        if (data.cryptoData) setCryptoData(data.cryptoData);
        if (data.marketStats) setMarketStats(data.marketStats);
        if (data.articles) setArticles(data.articles);
        if (data.sentimentAnalysis) setSentimentAnalysis(data.sentimentAnalysis);
        setError(null);
        setLoading(false);
        setStreamActive(true);
        setLastUpdate(new Date());
      },
      (err) => {
        setError("Connection failed");
        console.error("SSE Error:", err);
        setLoading(false);
        setStreamActive(false);
      }
    );
    return () => {
      setStreamActive(false);
      cleanup();
    };
  }, []);

  if (loading && cryptoData.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t('header.title')}</h1>
                  <p className="text-xs text-muted-foreground hidden lg:block">{t('loading.loadingData')}</p>
                </div>
              </div>

              {/* Navigation Tabs Skeleton */}
              <div className="flex items-center gap-1">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20 hidden lg:block" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Top Movers Skeleton */}
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-6 w-40 mb-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <Skeleton key={j} className="h-14 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Global Stats Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Market Dominance Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Bubble Chart Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="flex justify-center">
                <Skeleton className="h-[500px] w-full" />
              </CardContent>
            </Card>

            {/* Market Insights Skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <Skeleton key={j} className="h-6 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Table Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error && cryptoData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t('error.connectionError')}</CardTitle>
            <CardDescription>{t('error.failedToConnect')}</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = marketStats[0] || {};
  const totalMarketCap = parseFloat(stats.total_market_cap_usd) || 0;
  const btcDominance = parseFloat(stats.btc_dominance_pct) || 0;
  const fearGreed = parseInt(stats.fear_greed) || 0;

  // Calculate total volume from all crypto data
  const totalVolume = cryptoData.reduce((sum, crypto) => sum + (parseFloat(crypto.volume_24h_usd) || 0), 0);

  const priceChartData = cryptoData.slice(0, 10).map((item) => ({
    name: item.crypto?.symbol || "N/A",
    price: parseFloat(item.price_usd) || 0,
    volume: parseFloat(item.volume_24h_usd) || 0,
    marketCap: parseFloat(item.market_cap_usd) || 0,
  }));

  const volumeChartData = cryptoData.slice(0, 10).map((item) => ({
    name: item.crypto?.symbol || "N/A",
    volume24h: parseFloat(item.volume_24h_usd) / 1e9 || 0,
  }));

  const bubbleData = cryptoData.slice(0, 50).map((item) => ({
    name: item.crypto?.symbol || "N/A",
    volume: parseFloat(item.volume_24h_usd) || 1,
    marketCap: parseFloat(item.market_cap_usd) || 1,
    size: parseFloat(item.market_cap_usd) || 1,
    change: parseFloat(item.pct_change_24h) || 0,
    price: parseFloat(item.price_usd) || 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="market" className="w-full">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t('header.title')}</h1>
                  <p className="text-xs text-muted-foreground hidden lg:block">Real-time analytics</p>
                </div>
              </div>

              {/* Desktop Navigation Tabs */}
              <TabsList className="hidden md:flex bg-transparent border-b-0 h-auto p-0">
                <TabsTrigger
                  value="market"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                >
                  {t('header.market')}
                </TabsTrigger>
                <TabsTrigger
                  value="news"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                >
                  {t('header.news')}
                  <Badge variant="secondary" className="ml-2 text-xs">{articles.length}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="sentiment"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                >
                  {t('header.sentiment')}
                  <Badge variant="secondary" className="ml-2 text-xs">{sentimentAnalysis.length}</Badge>
                </TabsTrigger>
              </TabsList>

              {/* Desktop Right Side Actions */}
              <div className="hidden md:flex items-center gap-3">
                <Badge variant={streamActive ? "success" : "error"} className="h-6">
                  <div className={`h-2 w-2 rounded-full mr-2 ${streamActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="hidden lg:inline">{streamActive ? t('header.live') : "Offline"}</span>
                </Badge>
                {lastUpdate && (
                  <span className="text-xs text-muted-foreground hidden lg:block">
                    {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="rounded-lg"
                >
                  {i18n.language === 'en' ? 'Français' : 'English'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-lg"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex md:hidden items-center gap-2">
                <Badge variant={streamActive ? "success" : "error"} className="h-6">
                  <div className={`h-2 w-2 rounded-full ${streamActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="rounded-lg"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-4 pb-4 space-y-4 border-t pt-4">
                {/* Mobile Navigation */}
                <div className="flex flex-col gap-2">
                  <TabsList className="flex flex-col h-auto p-0 bg-transparent gap-2">
                    <TabsTrigger
                      value="market"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-3"
                    >
                      {t('header.market')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="news"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full justify-between data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-3"
                    >
                      <span>{t('header.news')}</span>
                      <Badge variant="secondary" className="text-xs">{articles.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger
                      value="sentiment"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full justify-between data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-3"
                    >
                      <span>{t('header.sentiment')}</span>
                      <Badge variant="secondary" className="text-xs">{sentimentAnalysis.length}</Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Mobile Actions */}
                <div className="flex flex-col gap-2 border-t pt-4">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={streamActive ? "success" : "error"} className="h-6">
                      <div className={`h-2 w-2 rounded-full mr-2 ${streamActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      {streamActive ? t('header.live') : "Offline"}
                    </Badge>
                  </div>

                  {lastUpdate && (
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm text-muted-foreground">Last Update</span>
                      <span className="text-sm">{lastUpdate.toLocaleTimeString()}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-muted-foreground">Language</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleLanguage}
                      className="rounded-lg"
                    >
                      {i18n.language === 'en' ? 'Français' : 'English'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="rounded-lg"
                    >
                      {theme === "dark" ? (
                        <><Sun className="h-4 w-4 mr-2" /> Light</>
                      ) : (
                        <><Moon className="h-4 w-4 mr-2" /> Dark</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">

          {/* Market Tab */}
          <TabsContent value="market" className="space-y-6">
            {/* Top Movers */}
            {cryptoData.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Top Gainers */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      {t('topMovers.gainers')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...cryptoData]
                        .sort((a, b) => (parseFloat(b.pct_change_24h) || 0) - (parseFloat(a.pct_change_24h) || 0))
                        .slice(0, 5)
                        .map((crypto, idx) => {
                          const change = parseFloat(crypto.pct_change_24h) || 0;
                          const price = parseFloat(crypto.price_usd) || 0;
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                              <div className="flex items-center gap-3">
                                <div className="text-lg font-bold text-muted-foreground">#{idx + 1}</div>
                                <div>
                                  <div className="font-semibold">{crypto.crypto?.name}</div>
                                  <div className="text-xs text-muted-foreground">{crypto.crypto?.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                <div className="text-green-500 font-bold">+{change.toFixed(2)}%</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Losers */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      {t('topMovers.losers')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...cryptoData]
                        .sort((a, b) => (parseFloat(a.pct_change_24h) || 0) - (parseFloat(b.pct_change_24h) || 0))
                        .slice(0, 5)
                        .map((crypto, idx) => {
                          const change = parseFloat(crypto.pct_change_24h) || 0;
                          const price = parseFloat(crypto.price_usd) || 0;
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                              <div className="flex items-center gap-3">
                                <div className="text-lg font-bold text-muted-foreground">#{idx + 1}</div>
                                <div>
                                  <div className="font-semibold">{crypto.crypto?.name}</div>
                                  <div className="text-xs text-muted-foreground">{crypto.crypto?.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                <div className="text-red-500 font-bold">{change.toFixed(2)}%</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Global Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t('stats.totalMarketCap')}</CardDescription>
                  <CardTitle className="text-2xl">
                    ${(totalMarketCap / 1e12).toFixed(2)}T
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t('table.volume')}</CardDescription>
                  <CardTitle className="text-2xl">
                    ${(totalVolume / 1e9).toFixed(2)}B
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t('stats.btcDominance')}</CardDescription>
                  <CardTitle className="text-2xl">{btcDominance.toFixed(2)}%</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>{t('stats.fearGreed')}</CardDescription>
                  <CardTitle className="text-2xl">
                    <div className="flex items-center gap-2">
                      <span>{fearGreed}</span>
                      <Badge variant={fearGreed < 25 ? "error" : fearGreed < 50 ? "outline" : fearGreed < 75 ? "default" : "success"}>
                        {fearGreed < 25 ? t('stats.fear') : fearGreed < 50 ? t('sentiment.neutral') : fearGreed < 75 ? t('stats.greed') : t('stats.extreme')}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Market Dominance */}
            <Card>
              <CardHeader>
                <CardTitle>{t('charts.marketDominance')}</CardTitle>
                <CardDescription>BTC's share of total market cap</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Bitcoin</span>
                    <span className="text-2xl font-bold">{btcDominance.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-4">
                    <div className="bg-orange-500 h-4 rounded-full transition-all" style={{ width: `${btcDominance}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Altcoins: {(100 - btcDominance).toFixed(2)}%</span>
                    <span>Total Market: ${(totalMarketCap / 1e12).toFixed(2)}T</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bubble Chart */}
            {cryptoData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('charts.bubbleChart')}</CardTitle>
                  <CardDescription>Bubble size = market cap | X-axis = 24h volume | Y-axis = market cap | Color = 24h change</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <BubbleChart
                    width={Math.min(900, window.innerWidth - 100)}
                    height={500}
                    data={bubbleData}
                  />
                </CardContent>
              </Card>
            )}

            {/* Market Insights */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Most Liquid (High Volume/Market Cap) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t('insights.highestLiquidity')}</CardTitle>
                  <CardDescription>High trading volume relative to market cap</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...cryptoData]
                      .map(c => ({
                        ...c,
                        ratio: (parseFloat(c.volume_24h_usd) || 0) / (parseFloat(c.market_cap_usd) || 1)
                      }))
                      .sort((a, b) => b.ratio - a.ratio)
                      .slice(0, 5)
                      .map((crypto, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{crypto.crypto?.symbol}</span>
                          <span className="text-muted-foreground">{(crypto.ratio * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Supply Scarcity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t('insights.mostScarceSupply')}</CardTitle>
                  <CardDescription>Coins closest to max supply</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...cryptoData]
                      .filter(c => parseFloat(c.supply_max) > 0)
                      .map(c => ({
                        ...c,
                        pct: (parseFloat(c.supply_circulating) / parseFloat(c.supply_max)) * 100
                      }))
                      .sort((a, b) => b.pct - a.pct)
                      .slice(0, 5)
                      .map((crypto, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{crypto.crypto?.symbol}</span>
                            <span className="text-muted-foreground">{crypto.pct.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${crypto.pct}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Highest Volume */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t('insights.highestVolume')}</CardTitle>
                  <CardDescription>Most actively traded</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...cryptoData]
                      .sort((a, b) => (parseFloat(b.volume_24h_usd) || 0) - (parseFloat(a.volume_24h_usd) || 0))
                      .slice(0, 5)
                      .map((crypto, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{crypto.crypto?.symbol}</span>
                          <span className="text-muted-foreground">
                            ${(parseFloat(crypto.volume_24h_usd) / 1e9).toFixed(2)}B
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 by Price</CardTitle>
                  <CardDescription>Current market prices</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={priceChartData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217.2 91.2% 59.8%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(217.2 91.2% 59.8%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="hsl(217.2 91.2% 59.8%)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 by Volume</CardTitle>
                  <CardDescription>24h trading volume (Billions)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={volumeChartData}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="volume24h"
                        stroke="hsl(142.1 76.2% 36.3%)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVolume)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Cryptocurrencies</CardTitle>
                <CardDescription>Complete market data with volume and supply metrics</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">{t('table.rank')}</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-transparent"
                            onClick={() => handleSort('name')}
                          >
                            {t('table.name')}
                            {sortColumn === 'name' ? (
                              sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-transparent ml-auto flex"
                            onClick={() => handleSort('price')}
                          >
                            {t('table.price')}
                            {sortColumn === 'price' ? (
                              sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-transparent ml-auto flex"
                            onClick={() => handleSort('change24h')}
                          >
                            {t('table.change24h')}
                            {sortColumn === 'change24h' ? (
                              sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-transparent ml-auto flex"
                            onClick={() => handleSort('change7d')}
                          >
                            {t('table.change7d')}
                            {sortColumn === 'change7d' ? (
                              sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-transparent ml-auto flex"
                            onClick={() => handleSort('volume')}
                          >
                            {t('table.volume')}
                            {sortColumn === 'volume' ? (
                              sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-transparent ml-auto flex"
                            onClick={() => handleSort('marketCap')}
                          >
                            {t('table.marketCap')}
                            {sortColumn === 'marketCap' ? (
                              sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-transparent ml-auto flex"
                            onClick={() => handleSort('supply')}
                          >
                            {t('table.supply')}
                            {sortColumn === 'supply' ? (
                              sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedData()
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((crypto, idx) => {
                        const absoluteIndex = (currentPage - 1) * itemsPerPage + idx;
                        const price = parseFloat(crypto.price_usd) || 0;
                        const change24h = parseFloat(crypto.pct_change_24h) || 0;
                        const change7d = parseFloat(crypto.pct_change_7d) || 0;
                        const volume24h = parseFloat(crypto.volume_24h_usd) || 0;
                        const marketCap = parseFloat(crypto.market_cap_usd) || 0;
                        const circSupply = parseFloat(crypto.supply_circulating) || 0;
                        const maxSupply = parseFloat(crypto.supply_max) || 0;

                        return (
                          <TableRow key={absoluteIndex}>
                            <TableCell className="font-medium">{absoluteIndex + 1}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{crypto.crypto?.name || "Unknown"}</div>
                                <div className="text-xs text-muted-foreground">
                                  {crypto.crypto?.symbol || "N/A"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${price.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={change24h >= 0 ? "success" : "error"}>
                                {change24h >= 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {Math.abs(change24h).toFixed(2)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={change7d >= 0 ? "text-green-500" : "text-red-500"}>
                                {change7d >= 0 ? "+" : ""}{change7d.toFixed(2)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              ${(volume24h / 1e6).toFixed(2)}M
                            </TableCell>
                            <TableCell className="text-right">
                              ${(marketCap / 1e9).toFixed(2)}B
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <div className="font-medium">{(circSupply / 1e6).toFixed(2)}M</div>
                                {maxSupply > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Max: {(maxSupply / 1e6).toFixed(2)}M
                                  </div>
                                )}
                                {maxSupply > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {((circSupply / maxSupply) * 100).toFixed(1)}% mined
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>

              {/* Pagination */}
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  <span className="hidden sm:inline">
                    {t('pagination.showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('pagination.to')} {Math.min(currentPage * itemsPerPage, cryptoData.length)} {t('pagination.of')} {cryptoData.length} {t('pagination.cryptocurrencies')}
                  </span>
                  <span className="sm:hidden">
                    {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, cryptoData.length)} {t('pagination.of')} {cryptoData.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-9"
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{t('pagination.previous')}</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(cryptoData.length / itemsPerPage) }, (_, i) => i + 1)
                      .filter(page => {
                        const totalPages = Math.ceil(cryptoData.length / itemsPerPage);
                        const isMobile = window.innerWidth < 640;

                        if (isMobile) {
                          // Show fewer pages on mobile
                          if (totalPages <= 3) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (page === currentPage) return true;
                          return false;
                        } else {
                          // Show more pages on desktop
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                          return false;
                        }
                      })
                      .map((page, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;
                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsis && <span className="px-1 sm:px-2 text-muted-foreground">...</span>}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 sm:w-9 sm:h-9 p-0 text-xs sm:text-sm"
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(cryptoData.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(cryptoData.length / itemsPerPage)}
                    className="h-9"
                  >
                    <span className="hidden sm:inline">{t('pagination.next')}</span>
                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-4">
            {articles.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No articles available</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {articles.map((article) => (
                  <Card key={article.id}>
                    <CardHeader>
                      <CardDescription>{article.source || t('news.source')}</CardDescription>
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {article.summary && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {article.summary}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {t('news.readMore')} →
                        </a>
                        <span className="text-xs text-muted-foreground">
                          {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-4">
            {sentimentAnalysis.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No sentiment analysis available</p>
              </Card>
            ) : (
              <>
                {/* Sentiment Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('tabs.sentiment')}</CardTitle>
                    <CardDescription>Aggregate sentiment metrics across all analyzed articles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Total Articles</div>
                        <div className="text-2xl font-bold">{sentimentAnalysis.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">{t('sentiment.positive')}</div>
                        <div className="text-2xl font-bold text-green-500">
                          {sentimentAnalysis.filter(s => s.sentiment_label?.toLowerCase() === 'positive').length}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">{t('sentiment.negative')}</div>
                        <div className="text-2xl font-bold text-red-500">
                          {sentimentAnalysis.filter(s => s.sentiment_label?.toLowerCase() === 'negative').length}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">{t('sentiment.neutral')}</div>
                        <div className="text-2xl font-bold text-slate-500">
                          {sentimentAnalysis.filter(s => s.sentiment_label?.toLowerCase() === 'neutral').length}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Sentiment Distribution</div>
                      <div className="flex w-full h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-green-500"
                          style={{ width: `${(sentimentAnalysis.filter(s => s.sentiment_label?.toLowerCase() === 'positive').length / sentimentAnalysis.length * 100).toFixed(1)}%` }}
                        ></div>
                        <div
                          className="bg-slate-500"
                          style={{ width: `${(sentimentAnalysis.filter(s => s.sentiment_label?.toLowerCase() === 'neutral').length / sentimentAnalysis.length * 100).toFixed(1)}%` }}
                        ></div>
                        <div
                          className="bg-red-500"
                          style={{ width: `${(sentimentAnalysis.filter(s => s.sentiment_label?.toLowerCase() === 'negative').length / sentimentAnalysis.length * 100).toFixed(1)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Sentiment Articles */}
                {sentimentAnalysis.map((sentiment) => {
                const score = parseFloat(sentiment.sentiment_score) || 0;
                const confidence = parseFloat(sentiment.confidence) || 0;
                const isPositive = sentiment.sentiment_label?.toLowerCase() === "positive";
                const isNegative = sentiment.sentiment_label?.toLowerCase() === "negative";

                return (
                  <Card key={sentiment.id}>
                    <CardHeader>
                      <div className="flex gap-2 mb-2">
                        <Badge variant={isPositive ? "success" : isNegative ? "error" : "outline"}>
                          {sentiment.sentiment_label}
                        </Badge>
                        <Badge variant="outline">Confidence: {(confidence * 100).toFixed(1)}%</Badge>
                        <Badge variant="outline">Score: {score.toFixed(3)}</Badge>
                      </div>
                      {sentiment.article?.title && (
                        <CardTitle className="text-base">{sentiment.article.title}</CardTitle>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Summary</h4>
                        <p className="text-sm text-muted-foreground">
                          {sentiment.summary || "No summary available"}
                        </p>
                      </div>

                      {sentiment.key_topics && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">{t('sentiment.topics')}</h4>
                          <div className="flex flex-wrap gap-1">
                            {sentiment.key_topics.split(",").map((topic, idx) => (
                              <Badge key={idx} variant="outline">
                                {topic.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {sentiment.impact_prediction && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">{t('sentiment.impact')}</h4>
                          <p className="text-sm text-muted-foreground">{sentiment.impact_prediction}</p>
                        </div>
                      )}

                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        {new Date(sentiment.analyzed_at).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

                {/* Sentiment Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('insights.sentimentInsights')}</CardTitle>
                    <CardDescription>Key patterns and correlations in market sentiment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Average Sentiment Score */}
                      <div>
                        <h4 className="font-semibold mb-3">{t('insights.averageSentiment')}</h4>
                        <div className="text-3xl font-bold mb-2">
                          {(sentimentAnalysis.reduce((sum, s) => sum + (parseFloat(s.sentiment_score) || 0), 0) / sentimentAnalysis.length).toFixed(3)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Average across {sentimentAnalysis.length} analyzed articles
                        </p>
                      </div>

                      {/* Average Confidence */}
                      <div>
                        <h4 className="font-semibold mb-3">{t('insights.avgConfidence')}</h4>
                        <div className="text-3xl font-bold mb-2">
                          {(sentimentAnalysis.reduce((sum, s) => sum + (parseFloat(s.confidence) || 0), 0) / sentimentAnalysis.length * 100).toFixed(1)}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          AI confidence in sentiment predictions
                        </p>
                      </div>

                      {/* Most Common Topics */}
                      <div className="md:col-span-2">
                        <h4 className="font-semibold mb-3">{t('insights.trendingTopics')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const allTopics = sentimentAnalysis
                              .flatMap(s => (s.key_topics || '').split(',').map(t => t.trim()))
                              .filter(t => t.length > 0);
                            const topicCounts = {};
                            allTopics.forEach(t => topicCounts[t] = (topicCounts[t] || 0) + 1);
                            return Object.entries(topicCounts)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 10)
                              .map(([topic, count]) => (
                                <Badge key={topic} variant="outline" className="text-xs">
                                  {topic} ({count})
                                </Badge>
                              ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}

function App() {
  return <CryptoApp />;
}

export default App;
