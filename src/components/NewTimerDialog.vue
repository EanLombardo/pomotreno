<template>
  <Dialog :visible="visible" @update:visible="$emit('close')" modal header="New Timer" :style="{ width: '25rem' }">
    <div class="grid grid-cols-1 gap-4">
      <div class="col-span-1">
        <FloatLabel variant="in" class="w-full">
          <AutoComplete class="w-full" id="timer-name" v-model="timerName" :suggestions="filteredTimerNames" @complete="searchTimerNames" dropdown/>
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
    </div>
    <template #footer>
      <Button label="Cancel" @click="$emit('close')" text />
      <Button label="Start" @click="start" />
    </template>
  </Dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import AutoComplete from 'primevue/autocomplete';
import InputNumber from 'primevue/inputnumber';
import FloatLabel from 'primevue/floatlabel';
import { db } from '@/db';
import { Mode } from '@/timer';

export default defineComponent({
  name: 'NewTimerDialog',
  components: {
    Dialog,
    Button,
    AutoComplete,
    InputNumber,
    SelectButton,
    FloatLabel,
  },
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['start', 'close'],
  setup(props, { emit }) {
    const timerName = ref('');
    const timerHours = ref(0);
    const timerMinutes = ref(25);
    const timerSeconds = ref(0);
    const typeOptions : Mode[] = ['stopwatch', 'countdown'];
    const timerType = ref(typeOptions[0]);
    const filteredTimerNames = ref<string[]>([]);

    function searchTimerNames(event: { query: string }) {
      const allTimerNames = db.tasks.value.map(t => t.name);
      if (!event.query.trim().length) {
        filteredTimerNames.value = [...allTimerNames];
      } else {
        filteredTimerNames.value = allTimerNames.filter((name) => {
          return name.toLowerCase().startsWith(event.query.toLowerCase());
        });
      }
    }

    function getDuration() : number {
      return ((timerHours.value * 3600) + (timerMinutes.value * 60) + timerSeconds.value) * 1000;
    }

    function start() {
      emit('start', {
        name: timerName.value,
        type: timerType.value,
        duration: getDuration(),
      });
      emit('close');
    }

    return {
      timerName,
      timerHours,
      timerMinutes,
      timerSeconds,
      timerType,
      typeOptions,
      filteredTimerNames,
      searchTimerNames,
      start,
    };
  },
});
</script>
