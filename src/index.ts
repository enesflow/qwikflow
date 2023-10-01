import {
  $,
  type QRL,
  Signal,
  useSignal,
  useTask$,
  type ValueOrPromise,
} from "@builder.io/qwik";

type UseOptimisticOptions = {
  revertOptimisticOnReject?: boolean;
};

type UseOptimisticSignalFromSignalOptions = {};
type UseOptimisticSignalOptions = {};

/**
 * Creates an optimistic signal based on the provided signal. The optimistic signal will
 * be updated every time the original signal is updated.
 * @template T
 * @param {Signal<T>} signal - The original signal.
 * @param {UseOptimisticSignalFromSignalOptions} [options] - Options for creating the optimistic signal.
 * @returns {Signal<T>} The optimistic signal.
 */
export function useOptimisticSignalFromSignal<T>(
  signal: Signal<T>,
  options?: UseOptimisticSignalFromSignalOptions
): Signal<T> {
  const optimisticSignal = useSignal<T>(signal.value);
  useTask$(({ track }) => {
    track(() => signal.value);
    optimisticSignal.value = signal.value;
  });
  return optimisticSignal;
}

/**
 * Creates a signal and an associated optimistic signal. The optimistic signal will
 * be updated every time the original signal is updated.
 * @template T
 * @param {T} value - The initial value for the signals.
 * @param {UseOptimisticSignalOptions} [options] - Options for creating the signals.
 * @returns {{ signal: Signal<T>; optimisticSignal: Signal<T>; }} An object containing the signal and optimisticSignal.
 */
export function useOptimisticSignal<T>(
  value: T,
  options?: UseOptimisticSignalOptions
): {
  signal: Signal<T>;
  optimisticSignal: Signal<T>;
} {
  const signal = useSignal<T>(value);
  return {
    signal,
    optimisticSignal: useOptimisticSignalFromSignal(signal, options),
  };
}

type UpdateFunction<T, TArgs extends any[]> = QRL<
  (
    signal: Signal<T>,
    optimisticSignal: Signal<T>,
    ...args: TArgs
  ) => ValueOrPromise<T>
>;

type ParameterArgs<T> = T extends (a: any, b: any, ...args: infer P) => any
  ? P
  : never;

/**
 * Creates a signal, an associated optimistic signal, and functions for optimistic updates.
 * @template T
 * @template TFunctions
 * @param {T} value - The initial value for the signals.
 * @param {TFunctions} [functions] - An array of update functions.
 * @param {UseOptimisticOptions} [options] - Options for creating the signals and handling optimistic updates.
 * @returns {{ signal: Signal<T>; optimisticSignal: Signal<T>; functions: Record<number, QRL<(...args: ParameterArgs<TFunctions[number]>) => Promise<void>>> }} An object containing the signal, optimisticSignal, and functions.
 */
export function useOptimistic<
  T,
  TFunctions extends
    | [UpdateFunction<T, any[]>, ...UpdateFunction<T, any[]>[]]
    | []
>(
  value: T,
  functions?: TFunctions,
  options: UseOptimisticOptions = {
    revertOptimisticOnReject: true,
  }
): {
  signal: Signal<T>;
  optimisticSignal: Signal<T>;
  functions: {
    [K in keyof TFunctions]: TFunctions[K] extends never
      ? never
      : QRL<(...args: ParameterArgs<TFunctions[K]>) => Promise<void>>;
  };
} {
  const signal = useSignal<T>(value);
  const optimisticSignal = useOptimisticSignalFromSignal(signal, options);
  const updateWrapper = (fn: TFunctions[number]) => {
    return $(async (...args: any[]) => {
      const before = signal.value;
      try {
        signal.value = await fn(signal, optimisticSignal, ...args);
      } catch (err) {
        options.revertOptimisticOnReject && (optimisticSignal.value = before);
        throw err;
      }
    });
  };
  return {
    signal,
    optimisticSignal,
    functions: (functions ?? []).map(updateWrapper) as any,
  };
}
