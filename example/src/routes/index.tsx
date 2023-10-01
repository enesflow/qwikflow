import { $, component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useOptimistic } from "../../../src";

export default component$(() => {
  const inputRef = useSignal<HTMLInputElement>();
  type TODO = {
    id: string;
    text: string;
  };
  const { optimisticSignal: todos, functions } = useOptimistic([] as TODO[], [
    $(async function addTodo(signal, optimisticSignal, text: string) {
      const id = Math.random().toString();
      optimisticSignal.value = [
        ...optimisticSignal.value,
        {
          id,
          text: text + " ⌛️",
        },
      ];
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newTodoIndex = optimisticSignal.value.findIndex(
        (todo) => todo.id === id
      );
      const beforeNewTodo = optimisticSignal.value.slice(0, newTodoIndex);
      const afterNewTodo = optimisticSignal.value.slice(newTodoIndex + 1);
      return [
        ...beforeNewTodo,
        {
          id,
          text: text + " ✅",
        },
        ...afterNewTodo,
      ];
    }),

    $(async function removeTodo(signal, optimisticSignal, id: string) {
      // set to "deleting" text
      optimisticSignal.value = optimisticSignal.value.filter(
        (todo) => todo.id !== id
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return optimisticSignal.value.filter((todo) => todo.id !== id);
    }),
  ]);
  const [addTodo, removeTodo] = functions;

  return (
    <>
      <form
        preventdefault:submit
        onSubmit$={() => {
          addTodo(inputRef.value?.value ?? "");
          inputRef.value!.value = "";
        }}
      >
        <input ref={inputRef} />
        <button type="submit">Add</button>
      </form>
      {todos.value.map((todo) => (
        <div key={todo.id}>
          {todo.text}
          <button
            onClick$={$(async () => {
              await removeTodo(todo.id);
            })}
          >
            Remove
          </button>
        </div>
      ))}
    </>
  );
});

export const head: DocumentHead = {
  title: "Optimistic Todo",
  meta: [
    {
      name: "description",
      content: "Optimistic Todo app",
    },
  ],
};
