import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
      pointBackgroundColor: string;
      pointBorderColor: string;
      pointBorderWidth: number;
    }[];
  };
}

export default function RadarChart({ data }: RadarChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        grid: {
          color: "#f3f4f6",
        },
        angleLines: {
          color: "#f3f4f6",
        },
        pointLabels: {
          font: {
            size: 11,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Radar data={data} options={options} />
    </div>
  );
}
