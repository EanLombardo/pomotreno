import { appSchema, tableSchema, Model, Database, Relation, Q, Query } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'
import { children, field, relation, text } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'
import { computed, Ref, ref } from 'vue'
import { from, useObservable } from '@vueuse/rxjs'
import { combineLatest, of, switchMap } from 'rxjs'
import { colorForName } from './utils'

export type TimeSpanType = 'paused' | 'running';

export class Task extends Model {
    static table = 'tasks'
    static associations: Associations = {
        time_spans: { type: 'has_many', foreignKey: 'task_id' }
    }

    @text('name') name!: string
    @children('time_spans') timeSpans!: Query<TimeSpan>

    timeSpansInRange: Readonly<Ref<TimeSpan[]>> =
        useObservable(combineLatest([from(db.from, { immediate: true }), from(db.to, { immediate: true })]).pipe(
            switchMap(([fromValue, toValue]) => {
                const clauses: Q.Clause[] = [];
                if (fromValue !== null) {
                    clauses.push(Q.where('start', Q.gte(fromValue)));
                }
                if (toValue !== null) {
                    clauses.push(Q.where('start', Q.lte(toValue)));
                }
                return this.timeSpans.extend(...clauses, Q.sortBy('start', 'asc')).observe();
            })
        ), { initialValue: [] });

    unpausedDurationInRange = computed<number>(() => {
        let t = this.timeSpansInRange.value.reduce((total, span) => {
            if (span.type === 'paused') {
                return total;
            }
            return total + span.duration;
        }, 0);
        return t;
    });

    get color(): string {
        return this.name ? colorForName(this.name) : 'transparent';
    }
}

export class TimeSpan extends Model {
    static table = 'time_spans'
    static associations: Associations = {
        tasks: { type: 'belongs_to', key: 'task_id' }
    }

    @field('start') start!: number
    @field('end') end!: number
    @field('type') type!: TimeSpanType
    @relation('tasks', 'task_id') task!: Relation<Task>

    get duration(): number {
        return this.end - this.start;
    }
}

export class db {
    static database = new Database({
        adapter: new LokiJSAdapter({
            schema: appSchema({
                version: 1,
                tables: [
                    tableSchema({
                        name: 'tasks',
                        columns: [
                            { name: 'name', type: 'string', isIndexed: true },
                        ]
                    }),
                    tableSchema({
                        name: 'time_spans',
                        columns: [
                            { name: 'start', type: 'number', isIndexed: true },
                            { name: 'end', type: 'number', },
                            { name: 'type', type: 'string' },
                            { name: 'task_id', type: 'string', isIndexed: true },
                        ]
                    }),
                ]
            }),
            useWebWorker: false,
            useIncrementalIndexedDB: true,
        }),
        modelClasses: [
            Task,
            TimeSpan
        ],
    })

    static from = ref<number | null>(null);
    static to = ref<number | null>(null);
    static timeSpansInRange: Readonly<Ref<TimeSpan[]>> = useObservable(combineLatest([from(this.from, { immediate: true }), from(this.to, { immediate: true })]).pipe(
        switchMap(([fromValue, toValue]) => {
            const clauses: Q.Clause[] = [];
            if (fromValue !== null) {
                clauses.push(Q.where('start', Q.gte(fromValue)));
            }
            if (toValue !== null) {
                clauses.push(Q.where('start', Q.lte(toValue)));
            }
            return this.database.get<TimeSpan>('time_spans').query(...clauses, Q.sortBy('start', 'asc')).observe();
        })),
        { initialValue: [] }
    );

    static tasksInRange: Readonly<Ref<Task[]>> = useObservable(from(this.timeSpansInRange, { immediate: true }).pipe(
        switchMap(timeSpans => {
            if (timeSpans.length === 0) {
                return of([] as Task[]);
            }
            const taskIds = [...new Set(timeSpans.map(ts => ts.task.id))];
            if (taskIds.length === 0) {
                return of([] as Task[]);
            }
            return this.database.get<Task>('tasks').query(Q.where('id', Q.oneOf(taskIds))).observe();
        })
    ), { initialValue: [] });

    static allTasks: Readonly<Ref<Task[]>> = useObservable(this.database.get<Task>('tasks').query().observe(), { initialValue: [] });
    static allSpans: Readonly<Ref<TimeSpan[]>> = useObservable(this.database.get<TimeSpan>('time_spans').query().observe(), { initialValue: [] });

    static async addTimeSpan(name: string, type: TimeSpanType, start: number, end: number): Promise<void> {
        await this.database.write(async () => {
            const tasksCollection = this.database.get<Task>('tasks');
            const timeSpansCollection = this.database.get<TimeSpan>('time_spans');

            const existingTasks = await tasksCollection.query(Q.where('name', name)).fetch();
            let task: Task;

            if (existingTasks.length > 0) {
                task = existingTasks[0];
            } else {
                task = await tasksCollection.create(_task => {
                    _task.name = name;
                });
            }

            await timeSpansCollection.create(timeSpan => {
                timeSpan.start = start;
                timeSpan.end = end;
                timeSpan.type = type;
                timeSpan.task.id = task.id;
            });
        });
    }

    static {
        // const tasksInRange$ = combineLatest([from(this.from), from(this.to)]).pipe(
        //     switchMap(([fromValue, toValue]) => {
        //         const clauses: Q.Clause[] = [];
        //         if (fromValue !== null) {
        //             clauses.push(Q.where('start', Q.gte(fromValue)));
        //         }
        //         if (toValue !== null) {
        //             clauses.push(Q.where('start', Q.lte(toValue)));
        //         }
        //         return this.database.get<TimeSpan>('time_spans').query(...clauses).observe();
        //     }),
        //     tap(timeSpans => {
        //         this.timeSpansInRange.value = timeSpans;
        //     }),
        //     switchMap(timeSpans => {
        //         if (timeSpans.length === 0) {
        //             return of([] as Task[]);
        //         }
        //         const taskIds = [...new Set(timeSpans.map(ts => ts.task.id))];
        //         if (taskIds.length === 0) {
        //             return of([] as Task[]);
        //         }
        //         return this.database.get<Task>('tasks').query(Q.where('id', Q.oneOf(taskIds))).observe();
        //     })
        // );
        // tasksInRange$.subscribe((tasks) => {
        //     this.tasksInRange.value = tasks;
        // });
    }
}