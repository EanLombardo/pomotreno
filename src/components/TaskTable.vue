<template>
  <Card class="grow" id="task-table">
    <template #content>
      <DataTable :value="tasks" dataKey="name" stripedRows sortField="totalDuration" :sortOrder="-1">
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
    return {
      tasks: db.tasksInRange,
      formatDuration,
    };
  },
});
</script>
