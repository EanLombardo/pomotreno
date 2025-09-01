<template>
  <Toolbar class="mb-2">
    <template #start>
      <RangeSelector />
      <FloatLabel variant="on">
        <MultiSelect v-model="filteredTasks" :options="filterTaskOptions" placeholder="Tasks" class="ml-2"
          optionLabel="name" :showToggleAll="false" display="chip" />
        <label for="task-filter">Tasks</label>
      </FloatLabel>
      <Checkbox v-model="showGaps" class="ml-2" inputId="show-gaps" binary />
      <label for="show-gaps" class="ml-1">Show Gaps</label>
      <Checkbox v-model="showPauses" class="ml-2" inputId="show-pauses" binary />
      <label for="show-pauses" class="ml-1">Show Pauses</label>
    </template>
  </Toolbar>
  <Card>
    <template #title>Timeline</template>
    <template #content>
      <div v-for="span in spans">
        <div class="flex items-center">
          <div>{{ span.formattedStart }}</div>
          <div class="grow m-2" style="background-color: white; height:3px;"></div>
        </div>
        <div class="flex items-center" v-if="span.type === 'running'">
          <div class="basis-1/3 text-end m-2">{{ span.formattedDuration }}</div>
          <div class="grow basis-2/3 rounded-xl p-2" v-bind:style="span.style.value">{{ span.name }}</div>
        </div>
        <div class="flex items-center" v-if="span.type === 'paused'">
          <div class="basis-1/3 text-end m-2">{{ span.formattedDuration }}</div>
          <div class="grow basis-2/3 rounded-xl p-2 opacity-50" v-bind:style="span.style.value">{{ span.name }} (Paused)
          </div>
        </div>
        <div class="flex items-center" v-bind:style="span.style.value" v-if="span.type === 'gap'">
          <div class="grow text-center">{{ span.formattedDuration }}</div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script lang="ts">
import { defineComponent, computed, Ref, ref } from 'vue';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import ToggleSwitch from 'primevue/toggleswitch';
import Column from 'primevue/column';
import Toolbar from 'primevue/toolbar';
import { db, TimeSpan } from '@/db';
import { formatDuration, formatTime, colorForName } from '@/utils';
import { map } from 'rxjs';
import { useObservable } from '@vueuse/rxjs';
import { sameDay } from '@/utils';
import RangeSelector from './RangeSelector.vue';
import { Checkbox } from 'primevue';
import MultiSelect from 'primevue/multiselect';
import { FloatLabel } from 'primevue';

const minHeightRem = 2;
const heightPerMinRem = 0.2;
const maxHeightRem = 20;

type FilterTask = {
  id: string;
  name: string;
};

export type TimelineSpanType = "running" | "paused" | "gap";

export class TimelineSpan {
  name: Readonly<Ref<string>> | null;
  start: number;
  duration: number;
  type: TimelineSpanType;
  includeDate: boolean;

  private constructor(
    name: Readonly<Ref<string>> | null,
    start: number,
    duration: number,
    type: TimelineSpanType
  ) {
    this.name = name;
    this.start = start;
    this.duration = duration;
    this.includeDate = false;
    this.type = type;
  }

  static fromSpanModel(span: TimeSpan): TimelineSpan {
    return new TimelineSpan(
      useObservable(span.task.observe().pipe(map(task => task.name))),
      span.start,
      span.duration,
      span.type,
    );
  }

  static gap(start: number, end: number): TimelineSpan {
    return new TimelineSpan(
      null,
      start,
      end - start,
      'gap',
    );
  }

  private get height() {
    const durationMins = this.duration / (60 * 1000);
    return Math.min(maxHeightRem, Math.max(minHeightRem, durationMins * heightPerMinRem)) + 'rem';
  }

  get style() {
    return computed(() => {
      return {
        backgroundColor: this.name?.value ? colorForName(this.name.value) : 'transparent',
        height: this.height,
      };
    });
  }

  get formattedDuration() {
    return formatDuration(this.duration);
  }

  get formattedStart() {
    if (this.includeDate) {
      return formatTime(this.start, true);
    }
    return formatTime(this.start);
  }
}

export default defineComponent({
  name: 'SpanTable',
  components: {
    Card,
    DataTable,
    Column,
    ToggleSwitch,
    RangeSelector,
    Toolbar,
    Checkbox,
    MultiSelect,
    FloatLabel,
  },
  setup() {
    const spans = computed<TimelineSpan[]>(() => {
      let filteredSpans = db.timeSpansInRange.value;
      if (!showPauses.value) {
        filteredSpans = filteredSpans.filter(s => s.type != 'paused');
      }
      if (filteredTasks.value.length > 0) {
        filteredSpans = filteredSpans.filter(s => filteredTasks.value.findIndex(t => t.id === s.task.id) >= 0);
      }

      const spans: TimelineSpan[] = [];
      for (let i = 0; i < filteredSpans.length; i++) {
        const currSpan = filteredSpans[i];
        spans.push(TimelineSpan.fromSpanModel(currSpan as TimeSpan));

        if (i < filteredSpans.length - 1) {
          const nextSpan = filteredSpans[i + 1];
          if (nextSpan.start != currSpan.end && showGaps.value) {
            spans.push(TimelineSpan.gap(currSpan.end, nextSpan.start));
          }
        }
      }

      for (let i = 0; i < spans.length; i++) {
        if (i == 0 || !sameDay(spans[i].start, spans[i - 1].start)) {
          spans[i].includeDate = true;
        }
      }
      return spans;
    });

    const showGaps = ref(true);
    const showPauses = ref(true);
    const filterTaskOptions = computed<FilterTask[]>(() => {
      return db.tasksInRange.value.map(t => ({ id: t.id, name: t.name })) as FilterTask[];
    });

    const filteredTasks = ref<FilterTask[]>([]);

    return {
      spans,
      formatDuration,
      showGaps,
      showPauses,
      filterTaskOptions,
      filteredTasks,
    };
  },
});
</script>
