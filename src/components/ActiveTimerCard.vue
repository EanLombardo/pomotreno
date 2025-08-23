<template>
  <Card class="col-span-2 shrink" v-show="state !== 'stopped'" id="active-timer-card">
    <template #title>Active Timer</template>
    <template #content>
      <canvas id="timer-canvas" width="400" height="200"></canvas>
      <div class="flex pt-2">
        <Button icon="pi pi-play" v-if="state === 'paused'" @click="play" />
        <Button icon="pi pi-pause" v-if="state === 'running'" @click="pause" />
        <div class="flex-grow"></div>
        <Button icon="pi pi-stop" @click="stopTimer" severity="danger"/>
      </div>
    </template>
  </Card>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { timer } from '@/timer';

export default defineComponent({
  name: 'ActiveTimerCard',
  components: {
    Card,
    Button,
  },
  setup() {
    let canvas!: HTMLCanvasElement;
    let ctx!: CanvasRenderingContext2D;

    onMounted(() => {
      canvas = document.getElementById('timer-canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d')!;
      draw();
    });

    watch(() => timer.state.value, () => {
      if (timer.state.value !== 'stopped') {
        draw();
      }
    });

    function draw(): void {
      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let timeToDraw: number;
      let progress: number;
      if (timer.mode.value === 'countdown') {
        timeToDraw = timer.remainingTimeAt(now) || 0;
        progress = (timer.duration.value! - timeToDraw) / timer.duration.value!;
      } else {
        timeToDraw = timer.elapsedTimeAt(now);
        progress = 1;
      }
      timeToDraw = timeToDraw / 1000;

      // Draw background progress
      if (timer.state.value === 'finished') {
        const flashColor = Math.floor(now / 500) % 2 === 0 ? 'red' : 'green';
        ctx.fillStyle = flashColor;
      } else {
        ctx.fillStyle = '#f0f0f0';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (timer.state.value !== 'finished') {
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(0, 0, canvas.width * progress, canvas.height);
      }

      // Draw timer text
      const minutes = Math.floor(timeToDraw / 60).toString().padStart(2, '0');
      const seconds = Math.floor(timeToDraw % 60).toString().padStart(2, '0');
      const timeString = `${minutes}:${seconds}`;

      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fontSize = canvas.height / 3;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillText(timeString, canvas.width / 2, canvas.height / 2);

      const nameFontSize = canvas.height / 8;
      ctx.font = `${nameFontSize}px sans-serif`;
      ctx.fillText(timer.timerName.value, canvas.width / 2, canvas.height / 2 + fontSize / 2 + 20);

      if (timer.state.value !== 'stopped') {
        requestAnimationFrame(draw);
      }
    }

    return {
      state: timer.state,
      play: () => timer.resume(),
      pause: () => timer.pause(),
      stopTimer: () => timer.stop(),
    };
  },
});
</script>
