# Custom Qwik hooks and utilities

useOptimisticSignalFromSignal

```tsx
import {component$, useSignal} from "@builder.io/qwik";
import {useOptimisticSignalFromSignal} from "@enesflow/qwikflow";

export default component$(() => {
	const likes = useSignal(0);
	const optimisticLikes = useOptimisticSignalFromSignal(likes); // <- Updates every time "likes" updates
	return (
		<div>
			<p>Likes: {optimisticLikes}</p>
			<button onClick$={async () => {
				optimisticLikes.value = optimisticLikes.value + 1; // <- Optimistic update
				await new Promise((resolve) => setTimeout(resolve, 1000)); // <- Simulate network delay
				likes.value = likes.value + 1; // <- Update the real value
			}}>Like
			</button>
		</div>
	);
})
```

useOptimisticSignal

```tsx
import {component$, useSignal} from "@builder.io/qwik";
import {useOptimisticSignal} from "@enesflow/qwikflow";
//        ⤴ just a wrapper around useOptimisticSignalFromSignal
export default component$(() => {
	const [likes, optimisticLikes] = useOptimisticSignal(0);
	// ... same as above (useOptimisticSignalFromSignal)
})
```

useOptimistic

```tsx
import {$, component$, useSignal} from "@builder.io/qwik";
import {useOptimistic} from "@enesflow/qwikflow";

export default component$(() => {
	const inputRef = useSignal<HTMLInputElement>();
	type TodoObject = string[]  // <- it would be better to use a type like this: { id: string, text: string }
	const {
		signal: realTodos,
		optimisticSignal: optimisticTodos,
		functions
	} = useOptimistic([] as TodoObject[], [
		$(async function addTodo(
			signal, // the real signal
			optimisticSignal, // the optimistic signal
			newTodo: TodoObject // custom arguments
		) {
			optimisticSignal.value = [...optimisticSignal.value, newTodo]; // <- optimistic update
			await new Promise((resolve) => setTimeout(resolve, 1000)); // <- simulate network delay
			if (newTodo === "not valid") {
				throw new Error("not valid"); // <- optimistic update will be reverted to the real value
			}
			return [...optimisticSignal.value, newTodo]; // <- update the real value
		}),

		$(async function removeTodo(signal, optimisticSignal, index: number) {
			optimisticSignal.value = optimisticSignal.value.filter((_, i) => i !== index); // <- optimistic update
			await new Promise((resolve) => setTimeout(resolve, 1000)); // <- simulate network delay
			return optimisticSignal.value.filter((_, i) => i !== index); // <- update the real value
		}),
	], {
		revertOptimisticOnReject: true, // default: true
	});

	const [addTodo, removeTodo] = functions; // the functions are typed correctly
	// addTodo: QRL<(newTodo: TodoObject) => Promise<void>>
	// removeTodo: QRL<(index: number) => Promise<void>>

	return (
		<>
			<form
				preventdefault:submit
				onSubmit$={$(() => {
					addTodo(inputRef.value?.value ?? "");
					inputRef.value!.value = "";
				})}
			>
				<input ref={inputRef}/>
				<button type="submit">Add</button>
			</form>
			{optimisticTodos.value.map((todo, index) => (
				<div key={index}>
					{todo}
					<button
						onClick$={$(() => {
							removeTodo(index);
						})}
					>
						Remove
					</button>
				</div>
			))}
		</>
	);
});

```