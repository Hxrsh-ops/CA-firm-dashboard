import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { dataService, useDataSync } from '../../services/dataService';

export const AnalyticsSection: React.FC = () => {
  useDataSync();
  const [intakeRange, setIntakeRange] = useState('Last 14 days');
  const [pendingRange, setPendingRange] = useState('Last 14 days');
  const [complianceRange, setComplianceRange] = useState('This Month');

  const isLoaded = dataService.getIsLoaded();
  const summary = dataService.getComplianceSummary();
  const intakeData = dataService.getIntakeTrend(14);
  const pendingData = dataService.getPendingTrend(14);
  const complianceData = dataService.getComplianceDistribution();

  const totalCompl = complianceData.reduce((acc, c) => acc + c.value, 0);
  const onTrackPct = summary?.on_track_percentage !== undefined
    ? summary.on_track_percentage
    : totalCompl > 0
    ? Math.round(((complianceData.find((c) => c.name === 'On Track')?.value || 0) / totalCompl) * 100)
    : 0;

  // Custom Tooltip for Charts
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2B231F] text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-[#DDD7CB]">
            Intake: <span className="text-white font-bold">{payload[0].value} docs</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2B231F] text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-[#DDD7CB]">
            Pending: <span className="text-white font-bold">{payload[0].value} items</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 select-none">
      {/* 1. Document Intake Trend (Bar Chart) */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F2EC]">
          <h3 className="text-[13.5px] font-semibold text-[#2B231F]">
            Document Intake Trend
          </h3>
          <div className="relative">
            <button
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A6F66] bg-[#FAF8F5] hover:bg-[#F3EFE9] px-2.5 py-1 rounded-lg border border-[#EAE6DF] transition-colors"
              onClick={() => {
                setIntakeRange(intakeRange === 'Last 14 days' ? 'Last 30 days' : 'Last 14 days');
              }}
            >
              <span>{intakeRange}</span>
              <ChevronDown className="w-3 h-3 text-[#9E9288]" />
            </button>
          </div>
        </div>

        <div className="h-44 w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={intakeData}
              margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F2EFE9"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9.5, fill: '#8C827A' }}
                axisLine={{ stroke: '#EAE6DF' }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 9.5, fill: '#8C827A' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 30]}
                ticks={[0, 10, 20, 30]}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="count"
                fill="#8E6F58"
                radius={[2, 2, 0, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Pending Items Trend (Line Chart) */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F2EC]">
          <h3 className="text-[13.5px] font-semibold text-[#2B231F]">
            Pending Items Trend
          </h3>
          <div className="relative">
            <button
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A6F66] bg-[#FAF8F5] hover:bg-[#F3EFE9] px-2.5 py-1 rounded-lg border border-[#EAE6DF] transition-colors"
              onClick={() => {
                setPendingRange(pendingRange === 'Last 14 days' ? 'Last 7 days' : 'Last 14 days');
              }}
            >
              <span>{pendingRange}</span>
              <ChevronDown className="w-3 h-3 text-[#9E9288]" />
            </button>
          </div>
        </div>

        <div className="h-44 w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={pendingData}
              margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F2EFE9"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9.5, fill: '#8C827A' }}
                axisLine={{ stroke: '#EAE6DF' }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 9.5, fill: '#8C827A' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 15]}
                ticks={[0, 5, 10, 15]}
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#755843"
                strokeWidth={2}
                dot={{ r: 3, fill: '#5F4635', stroke: '#FAF8F5', strokeWidth: 1.5 }}
                activeDot={{ r: 4.5, fill: '#3D2D22', stroke: '#FFF' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Compliance Status (Donut Chart with Center Text & Legend) */}
      <div className="bg-white border border-[#EAE6DF] rounded-xl p-4 shadow-card flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F2EC]">
          <h3 className="text-[13.5px] font-semibold text-[#2B231F]">
            Compliance Status
          </h3>
          <div className="relative">
            <button
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A6F66] bg-[#FAF8F5] hover:bg-[#F3EFE9] px-2.5 py-1 rounded-lg border border-[#EAE6DF] transition-colors"
              onClick={() => {
                setComplianceRange(complianceRange === 'This Month' ? 'Previous Month' : 'This Month');
              }}
            >
              <span>{complianceRange}</span>
              <ChevronDown className="w-3 h-3 text-[#9E9288]" />
            </button>
          </div>
        </div>

        {!isLoaded ? (
          <div className="flex flex-col items-center justify-center h-44 text-center">
            <div className="w-5 h-5 border-2 border-[#8E6F58] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-[#8C827A]">Loading compliance data...</span>
          </div>
        ) : complianceData.length === 0 || totalCompl === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-center">
            <span className="text-xs text-[#8C827A]">No compliance requirements recorded</span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 mt-2 h-44">
            {/* Donut Chart with Center Text */}
            <div className="w-[48%] h-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[20px] font-bold text-[#2B231F] leading-none font-display">
                  {onTrackPct}%
                </span>
                <span className="text-[10px] text-[#8C827A] font-medium mt-0.5">
                  On Track
                </span>
              </div>
            </div>

            {/* Right Legend List */}
            <div className="w-[52%] space-y-1.5 pl-1">
              {complianceData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-[11.5px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[#5C5148] font-normal">{item.name}</span>
                  </div>
                  <span className="font-semibold text-[#2B231F]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
