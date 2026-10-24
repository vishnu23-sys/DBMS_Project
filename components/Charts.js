'use client';

import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

// theme tokens from globals.css, so charts follow light/dark mode
const COLORS = {
  lost: 'var(--color-lost)', lost_reports: 'var(--color-lost)', found: 'var(--color-found)',
  returned: 'var(--color-ink)', recovered: 'var(--color-found)', events: 'var(--color-ink)', activeUsers: 'var(--color-found)',
};
const LABELS = { lost: 'Lost', found: 'Found', returned: 'Returned', recovered: 'Recovered', lost_reports: 'Lost', events: 'Events', activeUsers: 'Active users' };
const axis = { fontSize: 12, fill: 'var(--color-muted)' };
const tooltip = {
  contentStyle: { background: 'var(--color-surface)', border: '1px solid var(--color-line)', color: 'var(--color-ink)' },
  labelStyle: { color: 'var(--color-ink)' },
};

export function BarReport({ data, x, bars, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis dataKey={x} tick={axis} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} interval={0}
               angle={data.length > 6 ? -25 : 0} textAnchor={data.length > 6 ? 'end' : 'middle'} height={data.length > 6 ? 60 : 30} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...tooltip} cursor={{ fill: 'color-mix(in oklab, var(--color-ink) 6%, transparent)' }} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 13 }} />}
        {bars.map((b) => (
          <Bar key={b} dataKey={b} name={LABELS[b] ?? b} fill={COLORS[b] ?? 'var(--color-muted)'} radius={[3, 3, 0, 0]} maxBarSize={36} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineReport({ data, x, lines, height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis dataKey={x} tick={axis} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...tooltip} />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        {lines.map((l) => (
          <Line key={l} dataKey={l} name={LABELS[l] ?? l} stroke={COLORS[l] ?? 'var(--color-muted)'} strokeWidth={2.5} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
