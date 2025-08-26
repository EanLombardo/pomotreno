
import { ref } from 'vue';
import { db } from './db';

const video = document.getElementById('pip-video') as HTMLVideoElement;
video.addEventListener('loadedmetadata', () => {
    video.requestPictureInPicture();
});

video.addEventListener('leavepictureinpicture', () => {
    timer.stop();
});

addEventListener('beforeunload', async (event) => {
    if (timer.state.value !== 'stopped') {
        event.preventDefault();
        event.returnValue = true;
        await timer.pause();
    }
});
addEventListener('pagehide', async () => await timer.stop());

export type State = "paused" | "running" | 'stopped' | 'finished';
export type Mode = "countdown" | 'stopwatch';

export class timer {
    // The time that the current timer started
    static startTime = ref(0);
    static unpauseTime = ref(0);
    // How much time this timer has been paused in total.
    static elapsedPauseTime = ref(0);
    // The last time the timer was paused.
    static pauseTime = ref(0);
    static duration = ref<number | null>(null);
    static timerName = ref('');
    static state = ref<State>("stopped");
    static mode = ref<Mode>("stopwatch");

    static async start(name: string, mode: Mode, duration: number | null) {
        this.startTime.value = Date.now();
        this.unpauseTime.value = Date.now();
        this.timerName.value = name;
        this.mode.value = mode;
        this.duration.value = duration;
        this.state.value = "running";
        this.startTime.value = Date.now();
        this.elapsedPauseTime.value = 0;
        this.pauseTime.value = 0;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: name,
            artist: 'Pomotreno'
        });

        navigator.mediaSession.setActionHandler('play', () => this.pauseResume());
        navigator.mediaSession.setActionHandler('pause', () => this.pauseResume());
        navigator.mediaSession.setActionHandler('stop', () => this.stop());
        navigator.mediaSession.playbackState = 'playing';
    }

    static async pause() {
        if (this.state.value !== "running") return;
        this.pauseTime.value = Date.now();
        this.state.value = "paused";
        await db.addTimeSpan(this.timerName.value, 'running', this.unpauseTime.value, this.pauseTime.value);
    }

    static async resume() {
        if (this.state.value !== "paused") return;
        this.unpauseTime.value = Date.now();
        this.elapsedPauseTime.value += this.unpauseTime.value - this.pauseTime.value;
        this.state.value = "running";
        await db.addTimeSpan(this.timerName.value, 'paused', this.pauseTime.value, this.unpauseTime.value);
    }

    static async pauseResume() {
        if (this.state.value === "paused") {
            await this.resume();
        } else if (this.state.value === "running") {
            await this.pause();
        }
    }

    static async stop() {
        if (this.state.value === "stopped") return;

        if (this.state.value === "running") {
            await db.addTimeSpan(this.timerName.value, 'running', this.unpauseTime.value, Date.now());
        } else if (this.state.value === "paused") {
            await db.addTimeSpan(this.timerName.value, 'paused', this.pauseTime.value, Date.now());
        }
        this.state.value = "stopped";
        try {
            await document.exitPictureInPicture();
        } catch (error) {
            // Only happpens when already exited
        }
    }

    static async finished() {
        if (this.state.value === "running") {
            await db.addTimeSpan(this.timerName.value, 'running', this.startTime.value + this.elapsedPauseTime.value, Date.now());
        } else if (this.state.value === "paused") {
            await db.addTimeSpan(this.timerName.value, 'paused', this.pauseTime.value, Date.now());
        }
        this.state.value = "finished";
    }

    // Gets how much time has elapsed by the provided time
    static elapsedTimeAt(time: number): number {
        if (this.state.value === "running") {
            return time - this.startTime.value - this.elapsedPauseTime.value;
        }
        if (this.state.value === "finished") {
            return this.duration.value!;
        }
        if (this.state.value === "paused") {
            return this.pauseTime.value - this.startTime.value - this.elapsedPauseTime.value;
        }
        return 0;
    }

    static remainingTimeAt(time: number): number | null {
        if (this.duration.value !== null) {
            return this.duration.value - this.elapsedTimeAt(time);
        }
        return null;
    }
};
