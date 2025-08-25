<template>
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
import { defineComponent, computed, Ref } from 'vue';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import ToggleSwitch from 'primevue/toggleswitch';
import Column from 'primevue/column';
import { db, TimeSpan } from '@/db';
import { formatDuration, formatTime, colorForName } from '@/utils';
import { map } from 'rxjs';
import { useObservable } from '@vueuse/rxjs';

const minHeightRem = 2;
const heightPerMinRem = 0.2;
const maxHeightRem = 20;

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
    type: TimelineSpanType,
    includeDate: boolean
  ) {
    this.name = name;
    this.start = start;
    this.duration = duration;
    this.includeDate = includeDate;
    this.type = type;
  }

  static fromSpanModel(span: TimeSpan, includeDate: boolean): TimelineSpan {
    return new TimelineSpan(
      useObservable(span.task.observe().pipe(map(task => task.name))),
      span.start,
      span.duration,
      span.type,
      includeDate
    );
  }

  static gap(start: number, end: number, includeDate: boolean): TimelineSpan {
    return new TimelineSpan(
      null,
      start,
      end - start,
      'gap',
      includeDate
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
  },
  setup() {
    const spans = computed<TimelineSpan[]>(() => {
      let filteredSpans = db.timeSpansInRange.value;

      const spans: TimelineSpan[] = [];
      for (let i = 0; i < filteredSpans.length; i++) {
        const currSpan = filteredSpans[i]
        let includeDate = false;
        if (i == 0) {
          includeDate = true;
        } else {
          const prevSpan = filteredSpans[i - 1];
          const prevDate = new Date(prevSpan.start).toDateString();
          const currDate = new Date(currSpan.start).toDateString();
          if (prevDate != currDate) {
            includeDate = true;
          }
        }
        spans.push(TimelineSpan.fromSpanModel(currSpan as TimeSpan, includeDate));

        if (i < filteredSpans.length - 1) {
          const nextSpan = filteredSpans[i + 1];
          if (nextSpan.start != currSpan.end) {
            spans.push(TimelineSpan.gap(currSpan.end, nextSpan.start, includeDate));
          }
        }
      }
      return spans;
    });

    return {
      spans,
      formatDuration,
    };
  },
});
</script>
