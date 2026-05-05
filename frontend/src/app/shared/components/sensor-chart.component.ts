import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ChartConfiguration, ScriptableContext } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { SensorReading } from '../../models/sensor-reading.model';

const TICK          = '#64748b';
const GRID          = 'rgba(148, 163, 184, 0.12)';
const CHART_TEMP     = '#f97316';   // --chart-temp
const CHART_HUMIDITY = '#3b82f6';   // --chart-humidity
const CHART_CO2      = '#4ade80';   // --chart-co2

function areaGradient(
  top: string,
  bottom: string,
): (ctx: ScriptableContext<'line'>) => CanvasGradient | string {
  return (context: ScriptableContext<'line'>) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return top;
    const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    return g;
  };
}

@Component({
  selector: 'app-sensor-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  template: `
    <div class="chart-panel glass">
      <div class="chart-inner">
        <canvas
          baseChart
          [data]="chartData"
          [options]="chartOptions"
          [type]="'line'"
        ></canvas>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 280px;
      }

      .chart-panel {
        height: 100%;
        min-height: 280px;
        border-radius: var(--radius-lg);
        padding: 0.85rem 1rem 1rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      }

      .chart-inner {
        position: relative;
        height: min(340px, 42vh);
        min-height: 240px;
      }
    `,
  ],
})
export class SensorChartComponent implements OnChanges {
  @Input() readings: SensorReading[] = [];

  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'center',
        labels: {
          color: '#e2e8f0',
          boxWidth: 10,
          boxHeight: 10,
          padding: 16,
          font: { size: 11, weight: 500 },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 18, 26, 0.92)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: TICK, maxRotation: 0, font: { size: 10 } },
        grid: { color: GRID },
      },
      y: {
        position: 'left',
        title: { display: true, text: '°C', color: CHART_TEMP, font: { size: 11 } },
        ticks: { color: CHART_TEMP },
        grid: { color: GRID },
      },
      y1: {
        position: 'right',
        title: { display: true, text: '%', color: CHART_HUMIDITY, font: { size: 11 } },
        ticks: { color: CHART_HUMIDITY },
        grid: { drawOnChartArea: false },
      },
      y2: {
        position: 'right',
        title: { display: true, text: 'ppm', color: CHART_CO2, font: { size: 11 } },
        ticks: { color: CHART_CO2 },
        grid: { drawOnChartArea: false },
        offset: true,
      },
    },
  };

  ngOnChanges(): void {
    const labels = this.readings.map((r) => new Date(r.timestamp).toLocaleTimeString());
    this.chartData = {
      labels,
      datasets: [
        {
          data: this.readings.map((r) => r.temperature),
          label: 'Temperature (°C)',
          borderColor: CHART_TEMP,
          backgroundColor: areaGradient('rgba(249, 115, 22, 0.28)', 'rgba(249, 115, 22, 0)'),
          tension: 0.38,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          yAxisID: 'y',
          borderWidth: 2,
        },
        {
          data: this.readings.map((r) => r.humidity),
          label: 'Humidity (%)',
          borderColor: CHART_HUMIDITY,
          backgroundColor: areaGradient('rgba(59, 130, 246, 0.28)', 'rgba(59, 130, 246, 0)'),
          tension: 0.38,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          yAxisID: 'y1',
          borderWidth: 2,
        },
        {
          data: this.readings.map((r) => r.co2),
          label: 'CO₂ (ppm)',
          borderColor: CHART_CO2,
          backgroundColor: areaGradient('rgba(74, 222, 128, 0.28)', 'rgba(74, 222, 128, 0)'),
          tension: 0.38,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          yAxisID: 'y2',
          borderWidth: 2,
        },
      ],
    };
  }
}
