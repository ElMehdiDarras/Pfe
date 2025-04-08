// src/pages/Statistics.jsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { useAlarmStatistics } from '../hooks/useAlarms';
import { useSites } from '../hooks/useSites';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  Sector
} from 'recharts';

// Custom active pie sector configuration
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
        {`${value} alarmes`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

// Custom tooltip for trend chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1, boxShadow: 2, bgcolor: 'background.paper' }}>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: entry.color, mr: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {entry.name}: {entry.value}
            </Typography>
          </Box>
        ))}
      </Paper>
    );
  }
  return null;
};

// Enhanced chart component
const EnhancedTrendChart = ({ data, height = 400 }) => {
  const theme = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <Box sx={{ 
        height, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        border: '1px dashed #ccc',
        borderRadius: 1 
      }}>
        <Typography color="text.secondary">
          Aucune donnée disponible pour cette période
        </Typography>
      </Box>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart 
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f44336" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#f44336" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="majorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ff9800" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ffeb3b" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ffeb3b" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey={data[0]?.hour !== undefined ? "hour" : "day"} 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          stroke={theme.palette.divider}
        />
        <YAxis 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          stroke={theme.palette.divider}
        />
        <RechartsTooltip 
          content={<CustomTooltip />} 
          cursor={{ stroke: theme.palette.divider, strokeWidth: 1 }}
        />
        <Legend 
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: 10 }}
        />
        <Line
          type="monotone"
          dataKey="critical"
          name="Critique"
          stroke="#f44336"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          dot={{ r: 3, strokeWidth: 2 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="major"
          name="Majeure"
          stroke="#ff9800"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          dot={{ r: 3, strokeWidth: 2 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="warning"
          name="Warning"
          stroke="#ffeb3b"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          dot={{ r: 3, strokeWidth: 2 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Enhanced PieChart component
const AlarmDistributionPieChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const theme = useTheme();

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  if (!data || !data.length) {
    return (
      <Box sx={{ 
        height: 300, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        border: '1px dashed #ccc',
        borderRadius: 1 
      }}>
        <Typography color="text.secondary">
          Aucune donnée disponible
        </Typography>
      </Box>
    );
  }

  const COLORS = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          onMouseEnter={onPieEnter}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

const Statistics = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const queryClient = useQueryClient();
  
  // Fetch data
  const { data: sites } = useSites();
  const { data: alarmStats, isLoading, error } = useAlarmStatistics(timeRange);

  // Handle refresh button click
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['alarms', 'statistics'] });
  };

  // Handle time range change
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!alarmStats?.timeSeriesData) return null;
    
    if (timeRange === '24h' && alarmStats.timeSeriesData.hourly) {
      return alarmStats.timeSeriesData.hourly.map(item => ({
        hour: `${item.label}h`,
        critical: item.critical || 0,
        major: item.major || 0,
        warning: item.warning || 0
      }));
    }
    
    if (timeRange === '7d' && alarmStats.timeSeriesData.daily) {
      return alarmStats.timeSeriesData.daily.map(item => ({
        day: item.label,
        critical: item.critical || 0,
        major: item.major || 0,
        warning: item.warning || 0
      }));
    }
    
    if (timeRange === 'live' && alarmStats.timeSeriesData.recent) {
      return alarmStats.timeSeriesData.recent.map(item => ({
        hour: item.label,
        critical: item.critical || 0,
        major: item.major || 0,
        warning: item.warning || 0
      }));
    }
    
    return null;
  };

  // Get summary stats
  const getStats = () => {
    if (!alarmStats?.summary) {
      return {
        critical: 0,
        major: 0,
        warning: 0,
        total: 0,
        acknowledged: 0,
        unacknowledged: 0
      };
    }
    
    return {
      critical: alarmStats.summary.critical || 0,
      major: alarmStats.summary.major || 0,
      warning: alarmStats.summary.warning || 0,
      total: (alarmStats.summary.critical || 0) + 
             (alarmStats.summary.major || 0) + 
             (alarmStats.summary.warning || 0),
      acknowledged: alarmStats.summary.acknowledged || 0,
      unacknowledged: alarmStats.summary.unacknowledged || 0
    };
  };

  // Prepare pie chart data
  const preparePieData = () => {
    const stats = getStats();
    const data = [
      { name: 'Critique', value: stats.critical },
      { name: 'Majeure', value: stats.major },
      { name: 'Warning', value: stats.warning },
    ];
    
    // Filter out zero values
    return data.filter(item => item.value > 0);
  };

  const chartData = prepareChartData();
  const stats = getStats();
  const pieData = preparePieData();

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
          Statistiques
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 150, mr: 2 }} size="small">
            <InputLabel id="time-range-label">Période</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range-select"
              value={timeRange}
              label="Période"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="24h">24 heures</MenuItem>
              <MenuItem value="7d">7 jours</MenuItem>
              <MenuItem value="live">Temps réel</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Rafraîchir">
            <IconButton onClick={handleRefresh} sx={{ color: '#FF5722' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Stats Cards - 3 cards to match the design */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card 
            sx={{ 
              borderRadius: 1,
              boxShadow: 1,
              borderLeft: '4px solid #f44336',
              position: 'relative',
              overflow: 'visible',
              height: '100%'
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box sx={{ 
                width: 50, 
                height: 50, 
                borderRadius: '50%', 
                bgcolor: 'rgba(244, 67, 54, 0.1)', 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                right: 25,
                top: 20
              }}>
                <ErrorIcon color="error" />
              </Box>
              <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
                Alarmes Critiques
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                {stats.critical}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.critical > 0 
                  ? `${Math.round((stats.critical / Math.max(stats.total, 1)) * 100)}% des alarmes` 
                  : 'Aucune alarme critique'}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card 
            sx={{ 
              borderRadius: 1,
              boxShadow: 1,
              borderLeft: '4px solid #ff9800',
              position: 'relative',
              overflow: 'visible',
              height: '100%'
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box sx={{ 
                width: 50, 
                height: 50, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255, 152, 0, 0.1)', 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                right: 25,
                top: 20
              }}>
                <WarningIcon sx={{ color: '#ff9800' }} />
              </Box>
              <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
                Alarmes Majeures
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                {stats.major}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.major > 0 
                  ? `${Math.round((stats.major / Math.max(stats.total, 1)) * 100)}% des alarmes` 
                  : 'Aucune alarme majeure'}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card 
            sx={{ 
              borderRadius: 1,
              boxShadow: 1,
              borderLeft: '4px solid #ffeb3b',
              position: 'relative',
              overflow: 'visible',
              height: '100%'
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box sx={{ 
                width: 50, 
                height: 50, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255, 235, 59, 0.1)', 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                right: 25,
                top: 20
              }}>
                <WarningIcon sx={{ color: '#ffeb3b' }} />
              </Box>
              <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
                Alarmes Warning
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                {stats.warning}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.warning > 0 
                  ? `${Math.round((stats.warning / Math.max(stats.total, 1)) * 100)}% des alarmes` 
                  : 'Aucune alarme warning'}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Chart with improved styling */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className="dashboard-card chart-container" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
              Tendance des Alarmes {timeRange === '24h' ? '(24 Heures)' : timeRange === '7d' ? '(7 Jours)' : '(Temps Réel)'}
            </Typography>
            
            {isLoading ? (
              <Box sx={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box sx={{ 
                height: 400, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                color: 'error.main'
              }}>
                <Typography>Erreur de chargement des données</Typography>
              </Box>
            ) : (
              <EnhancedTrendChart data={chartData} height={400} />
            )}
          </Paper>
        </Grid>

        {/* Sites Statistics */}
        <Grid item xs={12} md={6}>
          <Paper className="dashboard-card" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
              Distribution des Alarmes par Site
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : alarmStats?.siteStats && alarmStats.siteStats.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {alarmStats.siteStats.map((site, index) => (
                  <Box key={site.name || index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {site.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {site.critical + site.major + site.warning} alarmes
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      {site.critical > 0 && (
                        <Box 
                          sx={{ 
                            height: '100%', 
                            bgcolor: '#f44336',
                            width: `${site.critical / Math.max(site.critical + site.major + site.warning, 1) * 100}%`
                          }} 
                        />
                      )}
                      {site.major > 0 && (
                        <Box 
                          sx={{ 
                            height: '100%', 
                            bgcolor: '#ff9800',
                            width: `${site.major / Math.max(site.critical + site.major + site.warning, 1) * 100}%`
                          }} 
                        />
                      )}
                      {site.warning > 0 && (
                        <Box 
                          sx={{ 
                            height: '100%', 
                            bgcolor: '#ffeb3b',
                            width: `${site.warning / Math.max(site.critical + site.major + site.warning, 1) * 100}%`
                          }} 
                        />
                      )}
                      {site.critical + site.major + site.warning === 0 && (
                        <Box 
                          sx={{ 
                            height: '100%', 
                            bgcolor: '#e0e0e0',
                            width: '100%'
                          }} 
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: 300,
                border: '1px dashed #ccc',
                borderRadius: 1 
              }}>
                <Typography color="text.secondary">
                  Aucune donnée disponible
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Legend and Summary */}
        <Grid item xs={12} md={6}>
          <Paper className="dashboard-card" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
              Résumé des Statistiques
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336', mr: 1 }} />
                  <Typography variant="body2">Alarmes Critiques - Nécessitent une intervention immédiate</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800', mr: 1 }} />
                  <Typography variant="body2">Alarmes Majeures - Nécessitent une attention rapide</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffeb3b', mr: 1 }} />
                  <Typography variant="body2">Alarmes Warning - À surveiller</Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Statistiques Globales
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Sites surveillés:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {sites?.length || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total des alarmes:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {stats.total}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Équipements supervisés:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {sites?.reduce((sum, site) => sum + (site.equipment?.length || 0), 0) || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {timeRange === 'live' && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 1, p: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 1, border: '1px solid rgba(25, 118, 210, 0.1)' }}>
                    <Typography variant="subtitle2" gutterBottom color="primary">
                      Mode Temps Réel
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Les données sont actualisées toutes les 30 secondes. 
                      Dernière actualisation: {new Date().toLocaleTimeString('fr-FR')}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Pie Chart - Added at the bottom */}
        <Grid item xs={12}>
          <Paper className="dashboard-card" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
              Distribution des types d'alarmes
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <AlarmDistributionPieChart data={pieData} />
            )}
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Survolez le graphique pour voir les détails de chaque type d'alarme
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default Statistics;