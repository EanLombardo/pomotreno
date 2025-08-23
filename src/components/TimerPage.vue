<template>
  <div>
    <div class="flex justify-center items-center pt-4 text-5xl" id="header"><img width="64" height="64" src="/public/icon128.png" srcset="/public/icon.svg" class="pr-2"/>Pomotreno</div>
    <div class="flex justify-center items-center pt-4">
      <NewTimerCard v-if="state === 'stopped'" @start="start" />
      <ActiveTimerCard v-show="state !== 'stopped'" />
    </div>
    <div class="md:flex gap-4 pt-4">
      <PieReport />
      <TaskTable />
    </div>
    <SpanTable />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { timer, Mode } from '@/timer';
import NewTimerCard from './NewTimerCard.vue';
import ActiveTimerCard from './ActiveTimerCard.vue';
import PieReport from './PieReport.vue';
import TaskTable from './TaskTable.vue';
import SpanTable from './SpanTable.vue';

export default defineComponent({
  name: 'TimerPage',
  components: {
    NewTimerCard,
    ActiveTimerCard,
    PieReport,
    TaskTable,
    SpanTable,
  },
  setup() {
    function start({ name, type, duration }: { name: string, type: Mode, duration: number}) {
      timer.start(name, type, duration);
      const video = document.getElementById('pip-video') as HTMLVideoElement;
      const canvas = document.getElementById('timer-canvas') as HTMLCanvasElement;
      const stream = canvas.captureStream();
      video.srcObject = stream;
      video.play();
      navigator.mediaSession.playbackState = 'playing';
    }

    return {
      state: timer.state,
      start,
    };
  },
});
</script>

<style>
.margin-top {
  margin-top: 1rem;
}
</style>
