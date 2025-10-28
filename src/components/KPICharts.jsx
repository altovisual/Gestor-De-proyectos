import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

const KPICharts = ({ kpis }) => {
  const getProgress = (kpi) => {
    return Math.min(100, Math.round((kpi.valorActual / kpi.valorMeta) * 100));
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' };
    if (progress >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' };
    return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' };
  };

  const getTrend = (kpi) => {
    const progress = getProgress(kpi);
    if (progress >= 80) return { icon: TrendingUp, color: 'text-green-500', label: 'En meta' };
    if (progress >= 50) return { icon: Minus, color: 'text-yellow-500', label: 'En progreso' };
    return { icon: TrendingDown, color: 'text-red-500', label: 'Crítico' };
  };

  // Agrupar por perspectiva
  const kpisByPerspectiva = kpis.reduce((acc, kpi) => {
    if (!acc[kpi.perspectiva]) {
      acc[kpi.perspectiva] = [];
    }
    acc[kpi.perspectiva].push(kpi);
    return acc;
  }, {});

  // Calcular promedio por perspectiva
  const perspectivaStats = Object.entries(kpisByPerspectiva).map(([perspectiva, kpis]) => {
    const totalProgress = kpis.reduce((sum, kpi) => sum + getProgress(kpi), 0);
    const avgProgress = totalProgress / kpis.length;
    return {
      perspectiva,
      kpis,
      avgProgress,
      count: kpis.length
    };
  });

  return (
    <div className="space-y-6">
      {/* Gráfica de barras general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Progreso por Perspectiva
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {perspectivaStats.map(({ perspectiva, avgProgress, count }) => {
              const colors = getProgressColor(avgProgress);
              return (
                <div key={perspectiva}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{perspectiva}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count} {count === 1 ? 'KPI' : 'KPIs'}
                      </Badge>
                    </div>
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {Math.round(avgProgress)}%
                    </span>
                  </div>
                  <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bg} transition-all duration-500 flex items-center justify-end px-3`}
                      style={{ width: `${avgProgress}%` }}
                    >
                      {avgProgress > 10 && (
                        <span className="text-xs font-semibold text-white">
                          {Math.round(avgProgress)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas individuales con gráficas */}
      {perspectivaStats.map(({ perspectiva, kpis: perspectivaKPIs }) => (
        <Card key={perspectiva}>
          <CardHeader>
            <CardTitle className="text-lg">{perspectiva}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {perspectivaKPIs.map((kpi) => {
                const progress = getProgress(kpi);
                const colors = getProgressColor(progress);
                const trend = getTrend(kpi);
                const TrendIcon = trend.icon;

                return (
                  <div
                    key={kpi.id}
                    className={`p-4 rounded-xl border-2 ${colors.light} border-gray-200 hover:shadow-md transition-all`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">
                          {kpi.objetivo}
                        </h4>
                        <p className="text-xs text-gray-600">{kpi.indicador}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${colors.light}`}>
                        <TrendIcon className={`w-5 h-5 ${trend.color}`} />
                      </div>
                    </div>

                    {/* Valores */}
                    <div className="mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {kpi.valorActual.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          / {kpi.valorMeta.toLocaleString()} {kpi.unidad}
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="mb-2">
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bg} transition-all duration-500`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Badge de estado */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={progress >= 80 ? 'success' : progress >= 50 ? 'warning' : 'destructive'}
                        className="text-xs"
                      >
                        {progress}% Completado
                      </Badge>
                      <span className={`text-xs font-medium ${trend.color}`}>
                        {trend.label}
                      </span>
                    </div>

                    {/* Gráfica de dona mini */}
                    <div className="mt-3 flex items-center justify-center">
                      <svg width="80" height="80" viewBox="0 0 80 80">
                        {/* Fondo */}
                        <circle
                          cx="40"
                          cy="40"
                          r="30"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="8"
                        />
                        {/* Progreso */}
                        <circle
                          cx="40"
                          cy="40"
                          r="30"
                          fill="none"
                          stroke={progress >= 80 ? '#22C55E' : progress >= 50 ? '#EAB308' : '#EF4444'}
                          strokeWidth="8"
                          strokeDasharray={`${(progress / 100) * 188.5} 188.5`}
                          strokeLinecap="round"
                          transform="rotate(-90 40 40)"
                        />
                        {/* Texto central */}
                        <text
                          x="40"
                          y="40"
                          textAnchor="middle"
                          dy="0.3em"
                          className="text-sm font-bold"
                          fill="#111827"
                        >
                          {progress}%
                        </text>
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Resumen estadístico */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Estadístico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">{kpis.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total KPIs</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600">
                {kpis.filter(k => getProgress(k) >= 80).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">En Meta</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <div className="text-3xl font-bold text-yellow-600">
                {kpis.filter(k => {
                  const p = getProgress(k);
                  return p >= 50 && p < 80;
                }).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">En Progreso</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-3xl font-bold text-red-600">
                {kpis.filter(k => getProgress(k) < 50).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Críticos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPICharts;
