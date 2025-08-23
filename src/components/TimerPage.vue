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
            <div class="col-span-1 flex justify-center items-center" v-if="timerType === 'countdown'">
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
            <Button icon="pi pi-stop" @click="stopTimer" severity="danger"/>
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
          <DataTable :value="tasks" dataKey="name" stripedRows sortField="totalDuration" :sortOrder="-1" v-model:selection="selectedTasks">
            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="name" header="Task Name" sortable></Column>
            <Column field="unpausedDuration" header="Total Duration" sortable>
              <template #body="slotProps">
                {{ formatDuration(slotProps.data.unpausedDuration) }}
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
    <Card>
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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, } from 'vue';
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
import { db } from '@/db';
import { timer, Mode } from '@/timer';

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
    const typeOptions : Mode[] = ['stopwatch', 'countdown'];
    const timerType = ref(typeOptions[0]);
    const fullTotalDuration = computed(() => {
      return db.tasks.value.reduce((total, task) => {
        return total + task.unpausedDuration;
      }, 0);
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
      const labels = db.tasks.value.map(task => task.name);
      const data = db.tasks.value.map(task => task.unpausedDuration);
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

    function searchTimerNames(event: { query: string }) {
      const allTimerNames = Object.keys(db.tasks.value);
      if (!event.query.trim().length) {
        filteredTimerNames.value = [...allTimerNames];
      } else {
        filteredTimerNames.value = allTimerNames.filter((name) => {
          return name.toLowerCase().startsWith(event.query.toLowerCase());
        });
      }
    }

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

    let canvas! : HTMLCanvasElement;
    let ctx! : CanvasRenderingContext2D;

    onMounted(() => {
      canvas = document.getElementById('timer-canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d')!;
    });

    function draw(): void {
      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let timeToDraw : number;
      let progress : number;
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

    function deleteSelected() {
    }

    function clearSelected() {
    }

    function exportToClipboard() {
      let yaml = 'tasks: \n'
      for(let task of db.tasks.value) {
        yaml += `  - name: "${task.name}"\n    totalDuration: ${task.unpausedDuration}\n`
      }
      navigator.clipboard.writeText(yaml).then(() => {
        console.log('YAML copied to clipboard');
      });
    }

    function getDuration() : number {
      return ((timerHours.value * 3600) + (timerMinutes.value * 60) + timerSeconds.value) * 1000;
    }

    function start() {
      timer.start(timerName.value, timerType.value, getDuration());
      const video = document.getElementById('pip-video') as HTMLVideoElement;
      const stream = canvas.captureStream();
      video.srcObject = stream;
      video.play();
      draw();
      navigator.mediaSession.playbackState = 'playing';
    }

    return {
      timerName,
      timerHours,
      timerMinutes,
      timerSeconds,
      timerType,
      typeOptions,
      tasks : db.tasks,
      spans: db.spans,
      filteredTimerNames,
      state: timer.state,
      searchTimerNames,
      formatDuration,
      start,
      play : () => timer.resume(),
      pause: () => timer.pause(),
      stopTimer: () => timer.stop(),
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
