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
          <div class="grow basis-2/3 rounded-xl p-2" v-bind:style="span.style">{{ span.name }}</div>
        </div>
        <div class="flex items-center" v-if="span.type === 'paused'">
          <div class="basis-1/3 text-end m-2">{{ span.formattedDuration }}</div>
          <div class="grow basis-2/3 rounded-xl p-2 opacity-50" v-bind:style="span.style">{{ span.name }} (Paused)</div>
        </div>
        <div class="flex items-center" v-bind:style="span.style" v-if="span.type === 'gap'">
          <div class="grow text-center">{{ span.formattedDuration }}</div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import ToggleSwitch from 'primevue/toggleswitch';
import Column from 'primevue/column';
import { db, SpanModel } from '@/db';
import { formatDuration, formatTime, colorForName } from '@/utils';

const minHeightRem = 2;
const heightPerMinRem = 0.2;
const maxHeightRem = 20;

export type TimelineSpanType = "running" | "paused" | "gap";

export class TimelineSpan {
  name: string | null;
  start: number;
  duration: number;
  type: TimelineSpanType;
  includeDate: boolean;

  private constructor(
    name: string | null,
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

  static fromSpanModel(span: SpanModel, includeDate: boolean): TimelineSpan {
    return new TimelineSpan(
      span.task ? span.task.name : null,
      span.span.start,
      span.span.duration,
      span.span.type,
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
    return {
      backgroundColor: this.name === null ? 'transparent' : colorForName(this.name),
      height: this.height,
    };
  }

  get formattedDuration() {
    return formatDuration(this.duration);
  }

  get formattedStart() {
    if(this.includeDate) {
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
      let filteredSpans = db.spans.value;

      const spans: TimelineSpan[] = [];
      for(let i=0; i < filteredSpans.length; i++) {
        const currSpan = filteredSpans[i]
        let includeDate = false;
        if(i == 0) {
          includeDate = true;
        } else {
          const prevSpan = filteredSpans[i - 1];
          const prevDate = new Date(prevSpan.span.start).toDateString();
          const currDate = new Date(currSpan.span.start).toDateString();
          if (prevDate != currDate) {
            includeDate = true;
          }
        }
        spans.push(TimelineSpan.fromSpanModel(currSpan, includeDate));

        if(i < filteredSpans.length - 1) {
          const nextSpan = filteredSpans[i + 1];
          if (nextSpan.span.start != currSpan.span.end) {
            spans.push(TimelineSpan.gap(currSpan.span.end, nextSpan.span.start, includeDate));
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
