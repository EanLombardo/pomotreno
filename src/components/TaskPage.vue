<template>
  <Toolbar class="mb-2">
    <template #start>
      <RangeSelector />
    </template>
    <template #end>
      <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportToClipboard" />
    </template>
  </Toolbar>
  <div class="md:flex gap-2">
    <TaskPieChart />
    <TaskTable />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskTable from './TaskTable.vue';
import TaskPieChart from './TaskPieChart.vue';
import RangeSelector from './RangeSelector.vue';
import { Toolbar } from 'primevue';
import { db } from '@/db';
import Button from 'primevue/button';

function exportToClipboard() {
  let yaml = 'tasks: \n'
  for (let task of db.tasksInRange.value) {
    yaml += `  - name: "${task.name}"\n    totalDuration: ${task.unpausedDurationInRange}\n`
  }
  navigator.clipboard.writeText(yaml).then(() => {
    console.log('YAML copied to clipboard');
  });
}

export default defineComponent({
  name: 'TaskPage',
  components: {
    TaskPieChart,
    TaskTable,
    RangeSelector,
    Toolbar,
    Button
  },
  setup() {
    return {
      exportToClipboard,
    };
  },
});
</script>
