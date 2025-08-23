<template>
  <Card class="shrink flex justify-center items-center" id="pie-report">
    <template #title>
      <h2 class="text-lg font-semibold">Total Duration: {{ formatDuration(fullTotalDuration) }}</h2>
    </template>
    <template #content>
      <Chart type="pie" :options="chartOptions" :data="chartData" class="w-full md:w-[30rem]"/>
    </template>
  </Card>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import { db } from '@/db';

export default defineComponent({
  name: 'PieReport',
  components: {
    Card,
    Chart,
  },
  setup() {
    const fullTotalDuration = computed(() => {
      return db.tasks.value.reduce((total, task) => {
        return total + task.unpausedDuration;
      }, 0);
    });

    const chartOptions = ref({
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (context : any) => {
              const value = formatDuration(context.raw || 0);
              return `${value}`;
            },
          },
        },
      },
    });

    function getUniqueColor(n : number) : string {
      const rgb = [0, 0, 0];
      for (let i = 0; i < 24; i++) {
          rgb[i%3] <<= 1;
          rgb[i%3] |= n & 0x01;
          n >>= 1;
      }
      return '#' + rgb.reduce((a, c) => (c > 0x0f ? c.toString(16) : '0' + c.toString(16)) + a, '');
    }

    const chartData = computed<object>(() => {
      const labels = db.tasks.value.map(task => task.name);
      const data = db.tasks.value.map(task => task.unpausedDuration);
      return {
        labels,
        datasets: [{
          label: 'Total Duration',
          data,
          backgroundColor: labels.map((_, i) => getUniqueColor(i + 1)),
          borderColor: 'black',
          borderWidth: 1
        }]
      };
    });

    function formatDuration(duration: number): string {
      duration = duration / 1000;
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = Math.floor(duration % 60);

      const segments :string[] = [];
      if (hours) {
        segments.push(`${hours}h`);
      }
      if (minutes) {
        segments.push(`${minutes}m`);
      }
      if (seconds) {
        segments.push(`${seconds}s`);
      }

      if(segments.length === 0) {
        return '0s';
      } else {
        return segments.join(' ');
      }
    }

    return {
      fullTotalDuration,
      chartOptions,
      chartData,
      formatDuration,
    };
  },
});
</script>
