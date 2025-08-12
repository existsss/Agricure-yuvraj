import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Droplets, Thermometer, Activity, Leaf, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchThingSpeakData, getMockThingSpeakData, ThingSpeakData } from "@/services/thingSpeakService";
import { recommendationService } from "@/services/recommendationService";
import { FertilizerRecommendation } from "@/services/supabaseClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { farmService, type FarmRecord } from "@/services/farmService";
import { getCropTypeOptions, getSoilTypeOptions } from "@/services/fertilizerMLService";

interface Farm {
  id: string;
  name: string;
  size: number;
  unit: string;
  lastUpdated: string;
  soilHealth: number;
}

interface EnhancedFarmOverviewProps {
  user?: any;
}

const EnhancedFarmOverview = ({ user }: EnhancedFarmOverviewProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [realTimeData, setRealTimeData] = useState<ThingSpeakData | null>(null);
  const [recommendations, setRecommendations] = useState<FertilizerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFarm, setNewFarm] = useState({ name: '', size: '', unit: 'hectares', cropType: '', soilType: '' });


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchThingSpeakData();
        if (data) {
          setRealTimeData(data);
        } else {
          // Fallback to mock data
          setRealTimeData(getMockThingSpeakData());
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setRealTimeData(getMockThingSpeakData());
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Refresh data every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.id) {
      const records = farmService.getFarmsByUser(user.id);
      setFarms(records);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;
    
    setRecommendationsLoading(true);
    try {
      const { data, error } = await recommendationService.getRecentRecommendations(user.id, 5);
      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setRecommendationsLoading(false);
    }
  };
  type NutrientType = 'nitrogen' | 'phosphorus' | 'potassium';

  const getNutrientStatus = (type: NutrientType, value: number) => {
    if (type === 'nitrogen') {
      if (value > 180) return { status: 'critical', color: 'text-red-600' };
      if (value >= 81) return { status: 'optimal', color: 'text-green-600' };
      return { status: 'warning', color: 'text-yellow-600' };
    }
    if (value > 350) return { status: 'critical', color: 'text-red-600' };
    if (value >= 111) return { status: 'optimal', color: 'text-green-600' };
    return { status: 'warning', color: 'text-yellow-600' };
  };

  const clampPercent = (percent: number) => Math.max(0, Math.min(100, percent));

  // Clamp helper for [0,1]
  const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

  // Normalization helpers following SHI specification
  const normalizeNitrogen = (n: number) => {
    if (n <= 80) return clamp01(n / 80);
    if (n <= 180) return 1;
    return clamp01(1 - (n - 180) / (240 - 180));
  };

  const normalizePhosphorus = (p: number) => {
    if (p <= 110) return clamp01(p / 110);
    if (p <= 350) return 1;
    return clamp01(1 - (p - 350) / (400 - 350));
  };

  const normalizePotassium = (k: number) => {
    if (k <= 110) return clamp01(k / 110);
    if (k <= 350) return 1;
    return clamp01(1 - (k - 350) / (400 - 350));
  };

  const normalizePH = (ph: number) => clamp01(1 - Math.abs(ph - 6.75) / 1.75);
  const normalizeSoilMoisture = (sm: number) => clamp01(1 - Math.abs(sm - 30) / 20);
  const normalizeTemperature = (t: number) => clamp01(1 - Math.abs(t - 25) / 10);
  const normalizeHumidity = (h: number) => clamp01(1 - Math.abs(h - 60) / 20);

  // Compute Soil Health Index percentage per provided weights
  const computeSoilHealthIndex = (data: ThingSpeakData) => {
    const sn = normalizeNitrogen(data.nitrogen);
    const sp = normalizePhosphorus(data.phosphorus);
    const sk = normalizePotassium(data.potassium);
    const sph = normalizePH(data.soilPH);
    const ssm = normalizeSoilMoisture(data.soilMoisture);
    const st = normalizeTemperature(data.temperature);
    const sh = normalizeHumidity(data.humidity);

    const weighted = 0.2 * sn + 0.15 * sp + 0.15 * sk + 0.15 * sph + 0.15 * ssm + 0.1 * st + 0.1 * sh;
    return clampPercent(weighted * 100);
  };

  const classifySHI = (percent: number) => {
    if (percent >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800 border-green-200' };
    if (percent >= 60) return { label: 'Good', color: 'bg-lime-100 text-lime-800 border-lime-200' };
    if (percent >= 40) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: 'Poor', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  const openFullReport = (rec: FertilizerRecommendation) => {
    navigate(`/recommendations/${rec.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-md">
              <CardContent className="p-3 sm:p-6">
                <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2"></div>
                <div className="h-6 sm:h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const shiPercent = realTimeData ? computeSoilHealthIndex(realTimeData) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-grass-50 to-green-50">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.overallSoilHealth')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-grass-600 animate-pulse" />
              <span className="text-lg sm:text-2xl font-bold text-grass-700">{Math.round(shiPercent)}%</span>
              {(() => { const c = classifySHI(shiPercent); return (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded border ${c.color}`}>{c.label}</span>
              ); })()}
            </div>
            <Progress value={shiPercent} className="mt-2 h-2 bg-grass-100" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.soilMoisture')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center space-x-2">
              <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 animate-bounce" />
              <span className="text-lg sm:text-2xl font-bold text-blue-700">{realTimeData?.soilMoisture.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-orange-50 to-red-50">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.temperature')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              <span className="text-lg sm:text-2xl font-bold text-orange-700">{realTimeData?.temperature.toFixed(1)}°C</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-cyan-50 to-blue-50">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.humidity')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center space-x-2">
              <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
              <span className="text-lg sm:text-2xl font-bold text-cyan-700">{realTimeData?.humidity.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NPK Levels */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
            <Leaf className="h-5 w-5 text-grass-600" />
            <span>{t('dashboard.npkLevels')}</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">{t('dashboard.npkDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-green-800">{t('dashboard.nitrogen')}</span>
                <span className="text-sm text-green-600 font-semibold">{realTimeData?.nitrogen.toFixed(1)} mg/kg</span>
              </div>
              <Progress value={clampPercent(((realTimeData?.nitrogen ?? 0) / 240) * 100)} className="h-2 bg-green-100" />
              {(() => { const s = getNutrientStatus('nitrogen', realTimeData?.nitrogen ?? 0); return (
                <div className={`text-xs ${s.color}`}>{s.status.toUpperCase()}</div>
              ); })()}
            </div>
            <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-blue-800">{t('dashboard.phosphorus')}</span>
                <span className="text-sm text-blue-600 font-semibold">{realTimeData?.phosphorus.toFixed(1)} mg/kg</span>
              </div>
              <Progress value={clampPercent(((realTimeData?.phosphorus ?? 0) / 400) * 100)} className="h-2 bg-blue-100" />
              {(() => { const s = getNutrientStatus('phosphorus', realTimeData?.phosphorus ?? 0); return (
                <div className={`text-xs ${s.color}`}>{s.status.toUpperCase()}</div>
              ); })()}
            </div>
            <div className="space-y-2 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-yellow-800">{t('dashboard.potassium')}</span>
                <span className="text-sm text-yellow-600 font-semibold">{realTimeData?.potassium.toFixed(1)} mg/kg</span>
              </div>
              <Progress value={clampPercent(((realTimeData?.potassium ?? 0) / 400) * 100)} className="h-2 bg-yellow-100" />
              {(() => { const s = getNutrientStatus('potassium', realTimeData?.potassium ?? 0); return (
                <div className={`text-xs ${s.color}`}>{s.status.toUpperCase()}</div>
              ); })()}
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{t('dashboard.lastUpdated')}: {realTimeData ? new Date(realTimeData.timestamp).toLocaleString() : 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Registered Farms */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-grass-600" />
            <span>{t('dashboard.registeredFarms')}</span>
          </CardTitle>
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm sm:text-base">{t('dashboard.farmsDescription')}</CardDescription>
            <Button size="sm" onClick={() => setIsAddOpen(true)}>{t('dashboard.addFarm') || 'Add Farm'}</Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {farms.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-600">{t('dashboard.noFarmsYet') || 'No farms added yet.'}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farms.map((farm, index) => (
                <div 
                  key={farm.id}
                  onClick={() => { setEditingId(farm.id); setNewFarm({ name: farm.name, size: String(farm.size), unit: farm.unit, cropType: farm.cropType, soilType: farm.soilType }); setIsAddOpen(true); }}
                  className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm sm:text-base text-gray-800">{farm.name}</h4>
                    <Badge variant="secondary" className="text-xs border">{farm.cropType}</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    {t('dashboard.size')}: {farm.size} {farm.unit}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    {t('form.soilType')}: {farm.soilType}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) { setEditingId(null); setNewFarm({ name: '', size: '', unit: 'hectares', cropType: '', soilType: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t('dashboard.editFarm') : t('dashboard.addFarm')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">{t('form.fieldName')}</Label>
                <Input value={newFarm.name} onChange={(e) => setNewFarm(v => ({ ...v, name: e.target.value }))} placeholder={t('form.fieldName')} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">{t('form.fieldSize')}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <Input type="number" className="col-span-1 sm:col-span-3" value={newFarm.size} onChange={(e) => setNewFarm(v => ({ ...v, size: e.target.value }))} placeholder="0.0" />
                  <div className="col-span-1 sm:col-span-2">
                    <Select value={newFarm.unit} onValueChange={(val) => setNewFarm(v => ({ ...v, unit: val }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('profile.unit')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hectares">{t('profile.hectares')}</SelectItem>
                        <SelectItem value="bigha">{t('profile.bigha')}</SelectItem>
                        <SelectItem value="acres">{t('profile.acres')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">{t('form.cropType')}</Label>
                <Select value={newFarm.cropType} onValueChange={(val) => setNewFarm(v => ({ ...v, cropType: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.cropType')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {getCropTypeOptions().map(opt => (
                      <SelectItem key={opt.value} value={opt.label}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">{t('form.soilType')}</Label>
                <Select value={newFarm.soilType} onValueChange={(val) => setNewFarm(v => ({ ...v, soilType: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.soilType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {getSoilTypeOptions().map(opt => (
                      <SelectItem key={opt.value} value={opt.label}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setIsAddOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={() => {
                if (!user?.id) return;
                const sizeNum = parseFloat(newFarm.size);
                if (!newFarm.name || isNaN(sizeNum) || !newFarm.cropType || !newFarm.soilType) return;
                if (editingId) {
                  farmService.updateFarm(editingId, { name: newFarm.name, size: sizeNum, unit: newFarm.unit as any, cropType: newFarm.cropType, soilType: newFarm.soilType });
                } else {
                  farmService.addFarm({ userId: user.id, name: newFarm.name, size: sizeNum, unit: newFarm.unit as any, cropType: newFarm.cropType, soilType: newFarm.soilType });
                }
                setFarms(farmService.getFarmsByUser(user.id));
                setIsAddOpen(false);
                setEditingId(null);
                setNewFarm({ name: '', size: '', unit: 'hectares', cropType: '', soilType: '' });
              }}>{editingId ? t('dashboard.updateFarm') : t('dashboard.saveFarm')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recommendation History */}
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-grass-600" />
            <span>{t('dashboard.recommendationHistory')}</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">{t('dashboard.recommendationHistoryDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {recommendationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-grass-600"></div>
              <span className="ml-2 text-sm">{t('dashboard.loadingRecommendations')}</span>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => (
                <div 
                  key={recommendation.id}
                  onClick={() => openFullReport(recommendation)}
                  role="button"
                  className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-300 hover:scale-102 cursor-pointer"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-800">{recommendation.field_name}</h4>
                      <Badge className={`${getStatusColor(recommendation.status)} text-xs w-fit border transition-all duration-200 hover:scale-105`}>
                        {recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      {t('dashboard.primary')}: <span className="font-medium">{recommendation.primary_fertilizer}</span>
                      {recommendation.secondary_fertilizer && (
                        <> | {t('dashboard.secondary')}: <span className="font-medium">{recommendation.secondary_fertilizer}</span></>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(recommendation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-grass-600 ml-2 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.noRecommendationsYet')}</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                {t('dashboard.startCreatingRecommendations')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full report opens via navigation on click; slide-over removed as per requirements */}
    </div>
  );
};

export default EnhancedFarmOverview;