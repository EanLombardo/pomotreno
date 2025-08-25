<template>
  <div class="flex">
    <NewTimerDialog :visible="showNewTimerDialog" @start="start" @close="showNewTimerDialog = false" />
    <Sidebar />
    <div class="grow">
      <div class="flex-grow p-2">
        <component :is="currentView" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { timer, Mode } from '@/timer';
import NewTimerDialog from './NewTimerDialog.vue';
import Timeline from './Timeline.vue';
import Sidebar from './Sidebar.vue';
import TaskPage from './TaskPage.vue';
import { currentView } from '@/routing';
import { showNewTimerDialog } from '@/dialog';

export default defineComponent({
  name: 'TimerPage',
  components: {
    Sidebar,
    NewTimerDialog,
    Timeline,
    TaskPage,
  },
  setup() {
    function start({ name, type, duration }: { name: string, type: Mode, duration: number }) {
      timer.start(name, type, duration);
      const video = document.getElementById('pip-video') as HTMLVideoElement;
      const canvas = document.getElementById('timer-canvas') as HTMLCanvasElement;
      const stream = canvas.captureStream();
      video.srcObject = stream;
      video.play();
      navigator.mediaSession.playbackState = 'playing';
      showNewTimerDialog.value = false;
    }

    return {
      state: timer.state,
      start,
      currentView,
      showNewTimerDialog,
    };
  },
});
</script>

<style>
.margin-top {
  margin-top: 1rem;
}
</style>
