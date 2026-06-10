import { Storage } from './storage';

interface Todo {
  id: string;
  text: string;
  type: 'daily' | 'weekly' | 'monthly';
  done: boolean;
  createdAt: number;
}

export class TodoManager {
  private storage: Storage;
  private container = document.getElementById('view-todos')!;
  private activeTab: 'daily' | 'weekly' | 'monthly' = 'daily';

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getTodos(): Todo[] {
    return this.storage.getJSON<Todo[]>('todos') || [];
  }

  addTodo(text: string, type: 'daily' | 'weekly' | 'monthly') {
    const todos = this.getTodos();
    todos.push({ id: crypto.randomUUID(), text, type, done: false, createdAt: Date.now() });
    this.storage.setJSON('todos', todos);
  }

  toggleTodo(id: string) {
    const todos = this.getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) todo.done = !todo.done;
    this.storage.setJSON('todos', todos);
  }

  deleteTodo(id: string) {
    const todos = this.getTodos().filter(t => t.id !== id);
    this.storage.setJSON('todos', todos);
  }

  render() {
    const todos = this.getTodos().filter(t => t.type === this.activeTab);
    const tabs = ['daily', 'weekly', 'monthly'] as const;

    this.container.innerHTML = `
      <h2 class="text-lg font-medium mb-3">My Todos 📝</h2>
      <div class="flex gap-2 mb-4">
        ${tabs.map(t => `<button class="todo-tab px-3 py-1.5 rounded-full text-xs font-medium ${t === this.activeTab ? 'bg-ink text-white' : 'bg-cream border border-beige-deep text-ink'}" data-tab="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>`).join('')}
      </div>
      <div class="mb-3">
        <div class="flex gap-2">
          <input id="new-todo" type="text" placeholder="Naya task add karo..." class="flex-1 rounded-md border border-hairline px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          <button id="add-todo-btn" class="bg-primary text-white rounded-md px-3 py-2 text-sm font-medium">Add</button>
        </div>
      </div>
      <div class="space-y-2">
        ${todos.length === 0 ? '<p class="text-sm text-muted text-center py-8">Koi task nahi hai! 🎉</p>' : ''}
        ${todos.map(t => `<div class="flex items-center gap-3 p-3 rounded-lg border border-hairline-soft ${t.done ? 'opacity-60' : ''}">
          <button class="todo-toggle shrink-0 w-5 h-5 rounded border ${t.done ? 'bg-primary border-primary' : 'border-hairline'} flex items-center justify-center" data-id="${t.id}">
            ${t.done ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
          </button>
          <span class="flex-1 text-sm ${t.done ? 'line-through text-muted' : ''}">${t.text}</span>
          <button class="todo-delete text-muted text-xs" data-id="${t.id}">✕</button>
        </div>`).join('')}
      </div>
    `;

    // Tab listeners
    this.container.querySelectorAll('.todo-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = (btn as HTMLElement).dataset.tab as typeof this.activeTab;
        this.render();
      });
    });

    // Add todo
    const addBtn = document.getElementById('add-todo-btn');
    const input = document.getElementById('new-todo') as HTMLInputElement;
    addBtn?.addEventListener('click', () => {
      if (input.value.trim()) { this.addTodo(input.value.trim(), this.activeTab); this.render(); }
    });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) { this.addTodo(input.value.trim(), this.activeTab); this.render(); }
    });

    // Toggle & delete
    this.container.querySelectorAll('.todo-toggle').forEach(btn => {
      btn.addEventListener('click', () => { this.toggleTodo((btn as HTMLElement).dataset.id!); this.render(); });
    });
    this.container.querySelectorAll('.todo-delete').forEach(btn => {
      btn.addEventListener('click', () => { this.deleteTodo((btn as HTMLElement).dataset.id!); this.render(); });
    });
  }
}
