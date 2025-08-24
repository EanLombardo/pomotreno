<template v-if="state !== 'stopped'">
  <div class="flex m-2" style="border: 1px solid var(--p-menu-border-color); border-radius: var(--p-menu-border-radius);">
    <Button size="small" icon="pi pi-play" v-if="state === 'paused'" @click="play" style="flex-shrink: 0;"/>
    <Button size="small" icon="pi pi-pause" v-if="state === 'running'" @click="pause" style="flex-shrink: 0;"/>
    <div ref="marqueeTextContainer" class="flex-grow flex items-center justify-center text-lg" style="overflow: hidden; min-width: 0;">
      <div ref="marqueeText" :class="{ 'animate-marquee': shouldAnimateMarquee }" class="marquee-text">{{ timerName }}</div>
    </div>
    <Button size="small" icon="pi pi-stop" @click="stopTimer" severity="danger" style="flex-shrink: 0;"/>
  </div>
</template>

<script lang="ts">  
import { defineComponent, onMounted, watch, ref, nextTick, useTemplateRef } from 'vue';
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

    const marqueeText = useTemplateRef<HTMLElement | null>('marqueeText');
    const marqueeTextContainer = useTemplateRef<HTMLElement | null>('marqueeTextContainer');
    const shouldAnimateMarquee = ref(false);

    const checkOverflow = () => {
      if (marqueeText.value && marqueeTextContainer.value) {
        shouldAnimateMarquee.value = marqueeText.value.scrollWidth > marqueeTextContainer.value.clientWidth;
      }
    };

    onMounted(() => {
      canvas = document.getElementById('timer-canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d')!;
      draw();
      nextTick(checkOverflow);
    });

    watch(() => timer.state.value, () => {
      if (timer.state.value !== 'stopped') {
        draw();
      }
    });

    watch(() => timer.timerName.value, () => {
      nextTick(checkOverflow);
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
      timerName: timer.timerName,
      play: () => timer.resume(),
      pause: () => timer.pause(),
      stopTimer: () => timer.stop(),
      marqueeText,
      shouldAnimateMarquee,
    };
  },
});
</script>

<style scoped>
.marquee-text {
  white-space: nowrap;
  display: flex;
  overflow: hidden;
}

.animate-marquee {
  animation: marquee 5s linear infinite;
}

@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
</style>