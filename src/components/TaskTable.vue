<template>
  <Card class="grow" id="task-table">
    <template #content>
      <Toolbar class="mb-6">
        <template #start>
          <Button label="Clear" class="mr-2" icon="pi pi-clock" severity="warn" variant="outlined"
            @click="clearSelected" :disabled="!selectedTasks || !selectedTasks.length" />
          <Button label="Delete" icon="pi pi-trash" severity="danger" variant="outlined" @click="deleteSelected"
            :disabled="!selectedTasks || !selectedTasks.length" />
        </template>
        <template #end>
          <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportToClipboard" />
        </template>
      </Toolbar>
      <DataTable :value="tasks" dataKey="name" stripedRows sortField="totalDuration" :sortOrder="-1"
        v-model:selection="selectedTasks">
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="name" header="Task Name" sortable></Column>
        <Column field="unpausedDuration" header="Total Duration" sortable>
          <template #body="slotProps">
            {{ formatDuration(slotProps.data.unpausedDurationInRange) }}
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toolbar from 'primevue/toolbar';
import { db } from '@/db';
import { formatDuration } from '@/utils';

export default defineComponent({
  name: 'TaskTable',
  components: {
    Card,
    Button,
    DataTable,
    Column,
    Toolbar,
  },
  setup() {
    const selectedTasks = ref();

    function deleteSelected() {
    }

    function clearSelected() {
    }

    function exportToClipboard() {
      let yaml = 'tasks: \n'
      for (let task of db.tasksInRange.value) {
        yaml += `  - name: "${task.name}"\n    totalDuration: ${task.unpausedDurationInRange}\n`
      }
      navigator.clipboard.writeText(yaml).then(() => {
        console.log('YAML copied to clipboard');
      });
    }

    return {
      tasks: db.tasksInRange,
      selectedTasks,
      formatDuration,
      deleteSelected,
      clearSelected,
      exportToClipboard,
    };
  },
});
</script>
