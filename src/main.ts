import { createApp } from 'vue';
import TimerPage from './components/TimerPage.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

if (!window.location.hash) {
    window.location.hash = '#/timeline';
}

const app = createApp(TimerPage);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.mount('#app');
