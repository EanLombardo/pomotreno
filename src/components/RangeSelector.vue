<template>
    <FloatLabel label="Date Range" variant="on">
        <DatePicker id="range" v-model="range" selectionMode="range" :minDate="minDate" :maxDate="maxDate" />
        <label for="range">Date Range</label>
    </FloatLabel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { db } from '../db';
import DatePicker from 'primevue/datepicker';
import { FloatLabel } from 'primevue';

function toDate(value: number): Date {
    return new Date(value);
}

function fromDate(value: Date): number {
    return value.valueOf();
}

const range = computed({
    get: () => {
        const from = toDate(db.from.value);
        let to = toDate(db.to.value);
        to?.setDate(to.getDate() - 1);
        if (from && to) {
            return [from, to];
        }
        return null;
    },
    set: (value) => {
        if (Array.isArray(value) && value.length === 2 && value[0] && value[1]) {
            db.from.value = fromDate(value[0]);
            let to = value[1];
            to.setDate(to.getDate() + 1);
            db.to.value = fromDate(to);
        }
    }
});

const minDate = computed(() => toDate(db.minDate.value));
const maxDate = computed(() => toDate(db.maxDate.value));
</script>