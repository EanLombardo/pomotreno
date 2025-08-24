<template>
  <div class="ml-2 mt-2">
    <Menu :model="items" :selectedOptionIndex="selectedIndex" :focusedOptionIndex="selectedIndex">
      <template #start class="flex flex-column">
        <div class="flex">
          <img class="grow ml-2 mr-2" src="/public/icon.svg" alt="Pomotreno icon" width="32" height="32" />
        </div>
        <span class="flex justify-center text-2xl mb-4">Pomotreno</span>
        <div style="max-width: 200px; overflow: hidden; flex-shrink: 1; min-width: 0;">
          <ActiveTimerCard v-show="state !== 'stopped'" />
        </div>
      </template>
    </Menu>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import Menu from 'primevue/menu';
import { MenuItem } from 'primevue/menuitem';
import { currentPath } from '@/routing';
import { timer } from '@/timer';
import { showNewTimerDialog } from '@/dialog';
import TimerControlls from './TimerControlls.vue';
import { db } from '@/db';

export default defineComponent({
  name: 'Sidebar',
  components: {
    Menu,
    TimerControlls,
  },
    setup() {
    const items = computed<MenuItem[]>(() => {
      const menuItems: MenuItem[] = [];
      if (timer.state.value === 'stopped') {
        menuItems.push({
          label: 'New Timer',
          icon: 'pi pi-fw pi-clock',
          command: () => {
            showNewTimerDialog.value = true;
          }
        });
      }
      menuItems.push({
        label: 'Timeline',
        icon: 'pi pi-fw pi-chart-line',
        url: '#/timeline',
      },
      {
        label: 'Tasks',
        icon: 'pi pi-fw pi-list',
        url: '#/tasks'
      });
      return menuItems;
    });

    const selectedIndex = computed(() => {
      return items.value.findIndex(item => item.url == '#' +currentPath.value);
    });

    return {
      items,
      selectedIndex,
      state: timer.state,
      storageUsageRatio: db.storageUsageRatio,
      storageUsedBytes: db.storageUsedBytes,
    };
  },
});
</script>