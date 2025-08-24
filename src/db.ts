import { computed, ref } from 'vue';
import { colorForName } from './utils';

export type TimeSpanType = 'paused' | 'running';

export class TimeSpan {
    type: TimeSpanType;
    readonly start: number;
    readonly end: number;

    constructor(type: TimeSpanType, start: number, end: number) {
        this.type = type;
        this.start = start;
        this.end = end;
    }

    get duration(): number {
        return this.end - this.start;
    }
}

export class Task {
    name: string;
    spans: TimeSpan[];
    color: string;

    constructor(name: string) {
        this.name = name;
        this.spans = [];
        this.color = colorForName(name);
    }

    addSpan(span: TimeSpan) {
        this.spans.push(span);
    }

    get startTime(): number | null {
        return this.spans[0]?.start || null;
    }

    get endTime(): number | null {
        return this.spans[this.spans.length - 1]?.end || null;
    }

    get unpausedDuration(): number {
        return this.spans.reduce((total, span) => {
            if (span.type === 'running') {
                total += span.duration;
            }
            return total;
        }, 0);
    }
}

export type SpanModel = {
    span : TimeSpan,
    task : Task,
}

export class db {
    static tasks = ref<Task[]>([]);
    static spans = computed<SpanModel[]>(() => {
        const result = db.tasks.value.flatMap(task => {
            return task.spans.map(span => {
                return { span, task };
            });
        });
        result.sort((a, b) => a.span.start - b.span.start);
        return result;
    });

    static async addTimeSpan(name : string, span: TimeSpan) {
        chrome.storage.sync.get('tasks', (result: { [key: string]: any; }) => {
            if (!result.tasks) {
                result.tasks = {};
            }
            const task = result.tasks[name];
            if (!task) {
                const newTask = new Task(name);
                newTask.spans.push(span);
                result.tasks[name] = newTask;
            } else {
                task?.spans.push(span);
            }
            const updated = { tasks: result.tasks };
            chrome.storage.sync.set(updated);
            this.populateInternal(updated);
        });
    }

    static populateInternal(result: { [key: string]: any; }) {
        this.tasks.value = [];
       if (result.tasks) {
            Object.keys(result.tasks).forEach((taskName) => {
                const task = new Task(taskName);
                task.spans = result.tasks[taskName].spans.map((s: any) => new TimeSpan(s.type, s.start, s.end));
                task.spans.sort((a, b) => a.start - b.start);
                this.tasks.value.push(task);
            });
            this.tasks.value.sort((a, b) => a.startTime! - b.startTime!);
        }
    }

    static async populate() {
         chrome.storage.sync.get('tasks', (result: { [key: string]: any; }) => {
            this.populateInternal(result);
        });
    }
}

chrome.storage.sync.onChanged.addListener((changes: { [key: string]: any }) => {
    db.populateInternal({tasks : changes.tasks.newValue});
});
db.populate();