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
import { formatDuration } from '@/utils';

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
      animations: false,
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

    const chartData = computed<object>(() => {
      const labels = db.tasks.value.map(task => task.name);
      const data = db.tasks.value.map(task => task.unpausedDuration);
      return {
        labels,
        datasets: [{
          label: 'Total Duration',
          data,
          backgroundColor: db.tasks.value.map(task => task.color),
          borderColor: 'black',
          borderWidth: 1,
        }]
      };
    });

    return {
      fullTotalDuration,
      chartOptions,
      chartData,
      formatDuration,
    };
  },
});
</script>
