export interface DebounceOptions {
    immediate?: boolean;
}

// FIXME: T extends (...args: any[]) => any is a bit loose, but works for now.
// Need to look into standardizing on UnknownFunction helper in our common types.
export function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number,
    options: DebounceOptions = {}
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    // Using 'this: any' because standard JS events bind dynamically. 
    // TODO: Check if we can extract actual context type using ThisParameterType<T>
    return function(this: any, ...args: Parameters<T>): void {
        const context = this;
        const { immediate = false } = options;

        const later = () => {
            timeoutId = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };

        const callNow = immediate && !timeoutId;

        if (timeoutId) {
            // console.log('clearing active timeout:', timeoutId); // Left in for local debug
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(later, delay);

        if (callNow) {
            func.apply(context, args);
        }
    };
}

// Quick manual test verify
// TODO: Move this to a proper Jest unit test spec file
/*
const handleResize = (width: number, height: number) => {
    console.log(`Resized to ${width}x${height}`);
};
const debounced = debounce(handleResize, 300);
window.addEventListener('resize', () => debounced(window.innerWidth, window.innerHeight));
*/