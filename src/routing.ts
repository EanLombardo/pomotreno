
import TaskPage from './components/TaskPage.vue';
import Timeline from './components/Timeline.vue';
import { ref, computed } from 'vue'

const routes = [
  { path: '/timeline', component: Timeline },
  { path: '/tasks', component: TaskPage },
];

const currentPathInternal = ref(window.location.hash)

window.addEventListener('hashchange', () => {
  currentPathInternal.value = window.location.hash
})

export const currentView = computed(() => {
  return routes.find(route => route.path === currentPathInternal.value.slice(1))?.component || Timeline
})

export const currentPath = computed(() => {
  return currentPathInternal.value || '/timeline'
})