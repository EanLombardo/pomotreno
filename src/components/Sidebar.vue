<template>
  <div class="ml-2 mt-2">
    <Menu :model="items" :selectedOptionIndex="selectedIndex" :focusedOptionIndex="selectedIndex">
      <template #start class="flex flex-column">
        <div class="flex">
          <img class="grow ml-2 mr-2" src="/public/icon.svg" alt="Pomotreno icon" width="32" height="32" />
        </div>
        <span class="flex justify-center text-2xl mb-4">Pomotreno</span>
        <div style="max-width: 200px; overflow: hidden; flex-shrink: 1; min-width: 0;">
          <TimerControlls v-show="state !== 'stopped'" />
        </div>
      </template>
      <template #end>
        <div class="flex justify-center m-1 space-x-4">
          <a class="github-button" href="https://github.com/EanLombardo/pomotreno/subscription"
            data-color-scheme="no-preference: dark; light: light; dark: dark;" data-size="large"
            aria-label="Watch EanLombardo/pomotreno on GitHub">Watch</a>
          <a class="github-button" href="https://github.com/EanLombardo/pomotreno/issues"
            data-color-scheme="no-preference: dark; light: light; dark: dark;" data-icon="octicon-issue-opened"
            data-size="large" aria-label="Issue EanLombardo/pomotreno on GitHub">Issue</a>
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
      return items.value.findIndex(item => item.url == '#' + currentPath.value);
    });

    return {
      items,
      selectedIndex,
      state: timer.state,
    };
  },
});
</script>