import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, MenuItem, TextField, Grid } from '@mui/material';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import type { Transaction, Category } from '@/db/schema';

interface StatsTabProps {
  transactions: Transaction[];
  categories: Category[];
  format: (cents: number) => string;
}

export const StatsTab: React.FC<StatsTabProps> = ({ transactions, categories, format }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statType, setStatType] = useState<'expense' | 'income'>('expense');

  const filteredTx = transactions.filter((tx) => tx.type === statType);

  // 1. Data Processing for Category Pie Chart Breakdown
  const categorySummary = filteredTx.reduce((acc, tx) => {
    const catId = tx.categoryId || 'uncategorized';
    const catObj = categories.find((c) => c.id === catId);
    const catName = catObj ? catObj.name : 'Uncategorized';
    acc[catName] = (acc[catName] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categorySummary).map(([name, val]) => ({ name, val }));
  const totalAmount = pieData.reduce((sum, item) => sum + item.val, 0);

  // 2. Data Processing for Monthly & Yearly Grouping
  const periodicSummary = filteredTx.reduce((acc, tx) => {
    const dateObj = new Date(tx.date);
    const periodKey = `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getFullYear()}`;
    acc[periodKey] = (acc[periodKey] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const periodicData = Object.entries(periodicSummary).slice(0, 6); // Max past 6 months

  // 3. Line Graph Generator for Category Selected over Time
  const lineGraphData = transactions
    .filter((tx) => selectedCategory === 'all' || tx.categoryId === selectedCategory)
    .sort((a, b) => a.date - b.date)
    .slice(-10); // Show last 10 points

  // Interactive Color Palette
  const chartColors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Configuration Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Analytics Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            value={statType}
            onChange={(e) => setStatType(e.target.value as 'expense' | 'income')}
            sx={{ minWidth: '120px' }}
          >
            <MenuItem value="expense">Expense</MenuItem>
            <MenuItem value="income">Income</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            sx={{ minWidth: '160px' }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.filter(c => c.type === statType).map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Category Share Meter / Pie-style Breakdown */}
        {/* Removed 'item' prop and updated to unified size prop */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '18px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PieIcon size={18} /> Category Breakdown
              </Typography>
              {pieData.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
                  No data compiled.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {pieData.map((item, idx) => {
                    const percentage = totalAmount > 0 ? (item.val / totalAmount) * 100 : 0;
                    return (
                      <Box key={idx}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{format(item.val)} ({percentage.toFixed(0)}%)</Typography>
                        </Box>
                        {/* Custom horizontal progressive progress bar */}
                        <Box sx={{ width: '100%', height: '8px', bgcolor: 'action.hover', borderRadius: '4px', overflow: 'hidden' }}>
                          <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: chartColors[idx % chartColors.length], borderRadius: '4px' }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Group By Time Period (Bar chart representation) */}
        {/* Removed 'item' prop and updated to unified size prop */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '18px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart3 size={18} /> Temporal Volumes (Grouped)
              </Typography>
              {periodicData.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>No historical sets.</Typography>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', pt: 2, px: 2 }}>
                  {periodicData.map(([period, val], idx) => {
                    const maxVal = Math.max(...periodicData.map(d => d[1]));
                    const barHeight = maxVal > 0 ? (val / maxVal) * 120 : 0;
                    return (
                      <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>{format(val)}</Typography>
                        <Box sx={{ width: '28px', height: `${barHeight}px`, bgcolor: 'primary.main', borderRadius: '4px 4px 0 0', minHeight: '4px' }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem' }}>{period}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SVG-based Dynamic Category Trend Line Graph */}
      <Card sx={{ borderRadius: '18px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>Selected Category Timeline</Typography>
          {lineGraphData.length < 2 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
              Add more transactions in this category to generate timeline curves.
            </Typography>
          ) : (
            <Box sx={{ width: '100%', height: '200px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
                {(() => {
                  const maxAmt = Math.max(...lineGraphData.map(t => t.amount));
                  const points = lineGraphData.map((t, idx) => {
                    const x = (idx / (lineGraphData.length - 1)) * 480 + 10;
                    const y = 140 - (maxAmt > 0 ? (t.amount / maxAmt) * 120 : 0);
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      {/* Gradient Fill under Path */}
                      <path
                        d={`M 10,140 L ${points} L 490,140 Z`}
                        fill="rgba(33, 150, 243, 0.08)"
                        stroke="none"
                      />
                      {/* Trend Curve Line */}
                      <polyline
                        fill="none"
                        stroke="#2196F3"
                        strokeWidth="3"
                        points={points}
                      />
                      {/* Interaction Nodes */}
                      {lineGraphData.map((t, idx) => {
                        const x = (idx / (lineGraphData.length - 1)) * 480 + 10;
                        const y = 140 - (maxAmt > 0 ? (t.amount / maxAmt) * 120 : 0);
                        return (
                          <circle
                            key={idx}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#FFFFFF"
                            stroke="#2196F3"
                            strokeWidth="2.5"
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  {new Date(lineGraphData[0].date).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  {new Date(lineGraphData[lineGraphData.length - 1].date).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};