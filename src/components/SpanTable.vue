<template>
  <Card id="span-table">
    <template #title>All Time Spans</template>
    <template #content>
      <DataTable :value="spans" dataKey="span.id" stripedRows sortField="span.start" :sortOrder="-1">
        <Column field="task.name" header="Task Name" sortable></Column>
        <Column field="span.type" header="Type" sortable></Column>
        <Column field="span.start" header="Start Time" sortable>
          <template #body="slotProps">
            {{ new Date(slotProps.data.span.start).toLocaleString() }}
          </template>
        </Column>
        <Column field="span.end" header="End Time" sortable>
          <template #body="slotProps">
            {{ slotProps.data.span.end ? new Date(slotProps.data.span.end).toLocaleString() : 'Ongoing' }}
          </template>
        </Column>
        <Column field="span.duration" header="Duration" sortable>
          <template #body="slotProps">
            {{ slotProps.data.span.end ? formatDuration(slotProps.data.span.duration) : 'Ongoing' }}
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { db } from '@/db';

export default defineComponent({
  name: 'SpanTable',
  components: {
    Card,
    DataTable,
    Column,
  },
  setup() {
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
      spans: db.spans,
      formatDuration,
    };
  },
});
</script>
