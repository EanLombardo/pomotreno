<template>
  <div class="md:flex gap-2">
    <TaskPieChart />
    <TaskTable />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskTable from './TaskTable.vue';
import TaskPieChart from './TaskPieChart.vue';

export default defineComponent({
  name: 'TaskPage',
  components: {
    TaskPieChart,
    TaskTable,
  },
});
</script>
