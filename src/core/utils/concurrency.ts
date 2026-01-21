/**
 * A simple concurrency limiter (like p-limit).
 * Created to avoid ESM/CJS compatibility issues with p-limit v7+ in this project.
 */
export function limitConcurrency(concurrency: number) {
    const queue: (() => void)[] = [];
    let activeCount = 0;

    const next = () => {
        activeCount--;
        if (queue.length > 0) {
            const job = queue.shift();
            job?.();
        }
    };

    const run = async (fn: () => Promise<any>, resolve: (value: any) => void, reject: (reason?: any) => void) => {
        activeCount++;
        try {
            const result = await fn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            next();
        }
    };

    return <T>(fn: () => Promise<T>): Promise<T> => {
        return new Promise((resolve, reject) => {
            const job = () => run(fn, resolve, reject);

            if (activeCount < concurrency) {
                job();
            } else {
                queue.push(job);
            }
        });
    };
}
