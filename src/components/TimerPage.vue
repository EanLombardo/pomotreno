<template>
  <div>
    <div class="flex justify-center items-center pt-4 text-5xl"><img width="64" height="64" src="/public/icon128.png" srcset="/public/icon.svg" class="pr-2"/>Pomotreno</div>
    <div class="flex justify-center items-center pt-4">
      <Card class="shrink" v-if="state === 'stopped'">
        <template #title>New Timer</template>
        <template #content>
          <div class="grid grid-cols-1 gap-4">
            <div class="col-span-1">
              <FloatLabel variant="in">
                <AutoComplete id="timer-name" v-model="timerName" :suggestions="filteredTimerNames" @complete="searchTimerNames" dropdown/>
                <label for="timer-name">Timer Name</label>
              </FloatLabel>
            </div>
            <SelectButton class="col-span-1 flex justify-center" v-model="timerType" :options="typeOptions" />
            <div class="col-span-1 flex justify-center items-center" v-if="timerType === 'Countdown'">
              <InputNumber id="timer-hours" v-model="timerHours" showButtons buttonLayout="vertical" mode="decimal" :min="0" style="width: 3rem"/>
              <span class="grow flex justify-center" style="font-size: 1rem;">h</span>
              <InputNumber id="timer-minutes" v-model="timerMinutes" showButtons buttonLayout="vertical" mode="decimal" :min="0" :max="59" style="width: 3rem"/>
              <span class="grow flex justify-center" style="font-size: 1rem;">m</span>
              <InputNumber id="timer-seconds" v-model="timerSeconds" showButtons buttonLayout="vertical" mode="decimal" :min="0" :max="59" style="width: 3rem"/>
              <span class="grow flex justify-center" style="font-size: 1rem;">s</span>
            </div>
            <Button class="col-span-1" label="Start" @click="start" />
          </div>
        </template>
      </Card>
      <Card class="col-span-2 shrink" v-show="state !== 'stopped'">
        <template #title>Active Timer</template>
        <template #content>
          <canvas id="timer-canvas" width="400" height="200"></canvas>
          <div class="flex pt-2">
            <Button icon="pi pi-play" v-if="state === 'paused'" @click="play" />
            <Button icon="pi pi-pause" v-if="state === 'running'" @click="pause" />
            <div class="flex-grow"></div>
            <Button icon="pi pi-stop" @click="stop" severity="danger"/>
          </div>
        </template>
      </Card>
    </div>
    <div class="md:flex gap-4 pt-4">
      <Card class="shrink flex justify-center items-center">
        <template #title>
          <h2 class="text-lg font-semibold">Total Duration: {{ formatDuration(fullTotalDuration) }}</h2>
        </template>
        <template #content>
          <Chart type="pie" :options="chartOptions" :data="chartData" class="w-full md:w-[30rem]"/>
        </template>
      </Card>
      <Card class="grow">
        <template #content>
          <Toolbar class="mb-6">
              <template #start>
                  <Button label="Clear" class="mr-2" icon="pi pi-clock" severity="warn" variant="outlined" @click="clearSelected" :disabled="!selectedTasks || !selectedTasks.length" />
                  <Button label="Delete" icon="pi pi-trash" severity="danger" variant="outlined" @click="deleteSelected" :disabled="!selectedTasks || !selectedTasks.length" />
              </template>
              <template #end>
                <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportToClipboard" />
              </template>
          </Toolbar>
          <DataTable :value="tableData" dataKey="name" stripedRows sortField="totalDuration" :sortOrder="-1" v-model:selection="selectedTasks">
            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="name" header="Task Name" sortable></Column>
            <Column field="totalDuration" header="Total Duration" sortable>
              <template #body="slotProps">
                {{ formatDuration(slotProps.data.totalDuration) }}
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import AutoComplete from 'primevue/autocomplete';
import InputNumber from 'primevue/inputnumber';
import FloatLabel from 'primevue/floatlabel';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toolbar from 'primevue/toolbar';

type State = "paused" | "running" | 'stopped' | 'finished';

export default defineComponent({
  name: 'TimerPage',
  components: {
    Card,
    Button,
    AutoComplete,
    InputNumber,
    SelectButton,
    FloatLabel,
    Chart,
    DataTable,
    Column,
    Toolbar
  },
  setup() {
    const timerName = ref('');
    const timerHours = ref(0);
    const timerMinutes = ref(25);
    const timerSeconds = ref(0);
    const typeOptions = ['Stopwatch', 'Countdown']
    const timerType = ref(typeOptions[0])
    const tasks = ref<Record<string, { totalDuration: number }>>({});
    const fullTotalDuration = computed(() => {
      return Object.values(tasks.value).reduce((acc, task) => acc + task.totalDuration, 0);
    });
    const tableData = computed(() => {
      return Object.entries(tasks.value).map(([name, { totalDuration }]) => ({
        name,
        totalDuration
      }));
    });
    const selectedTasks = ref();

    const chartOptions = ref({
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (context : any) => {
              const value = formatDuration(context.raw || 0);
              return `${value}`;
            },
          },
        },
      },
    })

    function getUniqueColor(n : number) : string {
      const rgb = [0, 0, 0];
      for (let i = 0; i < 24; i++) {
          rgb[i%3] <<= 1;
          rgb[i%3] |= n & 0x01;
          n >>= 1;
      }
      return '#' + rgb.reduce((a, c) => (c > 0x0f ? c.toString(16) : '0' + c.toString(16)) + a, '');
    }
    const chartData = computed<object>(() => {
      const labels = Object.keys(tasks.value);
      const data = Object.values(tasks.value).map(task => task.totalDuration);
      return {
        labels,
        datasets: [{
          label: 'Total Duration',
          data,
          backgroundColor: labels.map((_, i) => getUniqueColor(i + 1)),
          borderColor: 'black',
          borderWidth: 1
        }]
      };
    });

    const filteredTimerNames = ref<string[]>([]);
    const state = ref<State>('stopped');

    let startTime = 0;
    let pausedTime = 0;
    let lastUpdateTime = 0;
    let animationFrameId: number | null;
    let name = '';

    function searchTimerNames(event: { query: string }) {
      const allTimerNames = Object.keys(tasks.value);
      if (!event.query.trim().length) {
        filteredTimerNames.value = [...allTimerNames];
      } else {
        filteredTimerNames.value = allTimerNames.filter((name) => {
          return name.toLowerCase().startsWith(event.query.toLowerCase());
        });
      }
    }

    function formatDuration(duration: number): string {
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

    function renderTrackedTimers(): void {
      chrome.storage.sync.get('tasks', (result: { [key: string]: any; }) => {
        tasks.value = result.tasks || {};
      });
    }

   async function updateTrackedTime(name: string, elapsedSeconds: number): Promise<void> {
      return new Promise<void>((resolve) => {
        chrome.storage.sync.get('tasks', (result: { [key: string]: any; }) => {
          const newTasks = result.tasks || {};
          if (!newTasks[name]) {
            newTasks[name] = { totalDuration: 0 };
          }
          newTasks[name].totalDuration += elapsedSeconds;
          chrome.storage.sync.set({ tasks: newTasks }, () => {
            renderTrackedTimers();
            resolve();
          });
        });
      });
    }

      async function stop(): Promise<void> {
        if (state.value != 'stopped') {
          const now = Date.now();
          const elapsedSeconds = (now - lastUpdateTime) / 1000;
          state.value = 'stopped';
          await updateTrackedTime(name, elapsedSeconds);
        }

        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
        }
      }

      async function pause() {
        if (state.value === 'running') {
          state.value = 'paused';
          const now = Date.now();
          const elapsedSeconds = (now - lastUpdateTime) / 1000;
          updateTrackedTime(name, elapsedSeconds);
          navigator.mediaSession.playbackState = 'paused';
        }
      }

      async function play() {
        if (state.value === 'paused') {
          const now = Date.now();
          startTime = now - pausedTime * 1000;
          lastUpdateTime = now;
          navigator.mediaSession.playbackState = 'playing';
          state.value = 'running';

        }
      }

      async function playPause() {
        if (state.value === 'running') {
          await pause();
        } else if (state.value === 'paused') {
          await play();
        }
      }

    function startPipTimer(type: 'countdown' | 'stopwatch', duration: number): void {
      startTime = Date.now();
      lastUpdateTime = startTime;
      const canvas = document.getElementById('timer-canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;

      const video = document.getElementById('pip-video') as HTMLVideoElement;
      video.srcObject = canvas.captureStream();
      video.muted = true;
      state.value = 'running';
      name = timerName.value;

      function draw(): void {
        const now = Date.now();
        let elapsed: number;
        if (state.value === 'paused') {
          elapsed = pausedTime;
        } else {
          elapsed = (now - startTime) / 1000;
          pausedTime = elapsed;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let remainingTime: number, progress: number;

        if (type === 'countdown') {
          remainingTime = Math.max(0, duration - elapsed);
          progress = (duration - remainingTime) / duration;
          if (remainingTime === 0 && state.value === 'running') {
            pause();
            state.value = 'finished';
          }
        } else {
          remainingTime = elapsed;
          progress = 1;
        }

        // Draw background progress
        if (state.value === 'finished') {
          const flashColor = Math.floor(now / 500) % 2 === 0 ? 'red' : 'green';
          ctx.fillStyle = flashColor;
        } else {
          ctx.fillStyle = '#f0f0f0';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (state.value !== 'finished') {
          ctx.fillStyle = '#4caf50';
          ctx.fillRect(0, 0, canvas.width * progress, canvas.height);
        }

        // Draw timer text
        const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
        const seconds = Math.floor(remainingTime % 60).toString().padStart(2, '0');
        const timeString = `${minutes}:${seconds}`;

        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontSize = canvas.height / 3;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillText(timeString, canvas.width / 2, canvas.height / 2);

        const nameFontSize = canvas.height / 8;
        ctx.font = `${nameFontSize}px sans-serif`;
        ctx.fillText(name, canvas.width / 2, canvas.height / 2 + fontSize / 2 + 20);

        animationFrameId = requestAnimationFrame(draw);
      }

      if ('mediaSession' in navigator && 'MediaMetadata' in window) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: name,
          artist: 'Pomotreno'
        });

        navigator.mediaSession.setActionHandler('play', playPause);
        navigator.mediaSession.setActionHandler('pause', playPause);
        navigator.mediaSession.setActionHandler('stop', stop);
      }

      video.addEventListener('loadedmetadata', () => {
        video.requestPictureInPicture();
      });

      video.addEventListener('leavepictureinpicture', () => {
        stop();
      });

      video.play();
      draw();
      navigator.mediaSession.playbackState = 'playing';
    }

    function start() {
      if (timerType.value === 'Countdown') {
        startCountdown();
      } else {
        startStopwatch();
      }
    }

    function startCountdown() {
      const duration = timerHours.value * 3600 + timerMinutes.value * 60 + timerSeconds.value;
      if (duration > 0) {
        startPipTimer('countdown', duration);
      }
    }

    function startStopwatch() {
      startPipTimer('stopwatch', 0);
    }

    function deleteSelected() {
      if (selectedTasks.value && selectedTasks.value.length) {
        chrome.storage.sync.get('tasks', (result: { [key: string]: any; }) => {
          const newTasks = result.tasks || {};
          selectedTasks.value.forEach((task: any) => {
            if (newTasks[task.name]) {
              delete newTasks[task.name];
            }
          });
          chrome.storage.sync.set({ tasks: newTasks }, () => {
            renderTrackedTimers();
          });
        });
      }
    }

    function clearSelected() {
      if (selectedTasks.value && selectedTasks.value.length) {
        chrome.storage.sync.get('tasks', (result: { [key: string]: any; }) => {
          const newTasks = result.tasks || {};
          selectedTasks.value.forEach((task: any) => {
            if (newTasks[task.name]) {
              newTasks[task.name].totalDuration = 0;
            }
          });
          chrome.storage.sync.set({ tasks: newTasks }, () => {
            renderTrackedTimers();
          });
        });
      }
    }

    function exportToClipboard() {
      let yaml = 'tasks: \n'
      for(let taskName in tasks.value) {
        const task = tasks.value[taskName];
        yaml += `  - name: "${taskName}"\n    totalDuration: ${task.totalDuration}\n`
      }
      navigator.clipboard.writeText(yaml).then(() => {
        console.log('YAML copied to clipboard');
      });
    }

    addEventListener('unload', async () => await stop());
    addEventListener('beforeunload', async (event) => {
      if (state.value !== 'stopped') {
        event.preventDefault();
        event.returnValue = true;
        await pause();
      }
    });
    addEventListener('pagehide', async () => await stop());
    
    onMounted(() => {
      renderTrackedTimers();
    });

    return {
      timerName,
      timerHours,
      timerMinutes,
      timerSeconds,
      timerType,
      typeOptions,
      tasks,
      filteredTimerNames,
      state,
      searchTimerNames,
      formatDuration,
      start,
      play,
      pause,
      stop,
      tableData,
      selectedTasks,
      clearSelected,
      deleteSelected,
      chartData,
      chartOptions,
      fullTotalDuration,
      exportToClipboard,
    };
  },
});
</script>

<style>
.margin-top {
  margin-top: 1rem;
}
</style>
