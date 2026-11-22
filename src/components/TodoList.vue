<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  todos: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-status', 'edit', 'delete'])

const searchQuery = ref('')
const statusFilter = ref('all') // 'all', 'active', 'finished'
const sortBy = ref('date_from_asc')

const filteredTodos = computed(() => {
  return props.todos
    .filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesStatus =
        statusFilter.value === 'all' ? true :
        statusFilter.value === 'finished' ? todo.is_finished :
        !todo.is_finished
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy.value === 'date_from_asc') return new Date(a.date_from) - new Date(b.date_from)
      if (sortBy.value === 'date_from_desc') return new Date(b.date_from) - new Date(a.date_from)
      if (sortBy.value === 'date_to_asc') return new Date(a.date_to) - new Date(b.date_to)
      return new Date(b.date_to) - new Date(a.date_to)
    })
})

function isOverdue(todo) {
  return !todo.is_finished && new Date(todo.date_to) < new Date()
}
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="card shadow-sm border-0 p-3 mb-3">
      <div class="row g-2 align-items-center">
        <div class="col-12 col-md-4">
          <input
            v-model="searchQuery"
            type="text"
            class="form-control form-control-sm"
            placeholder="Vyhľadať podľa názvu..."
          >
        </div>
        <div class="col-6 col-md-3">
          <select v-model="statusFilter" class="form-select form-select-sm">
            <option value="all">Všetky úlohy</option>
            <option value="active">Nedokončené</option>
            <option value="finished">Dokončené</option>
          </select>
        </div>
        <div class="col-6 col-md-3">
          <select v-model="sortBy" class="form-select form-select-sm">
            <option value="date_from_asc">Začiatok (najskôr)</option>
            <option value="date_from_desc">Začiatok (najneskôr)</option>
            <option value="date_to_asc">Koniec (najskôr)</option>
            <option value="date_to_desc">Koniec (najneskôr)</option>
          </select>
        </div>
        <div class="col-12 col-md-2 text-md-end">
          <span class="badge bg-secondary">{{ filteredTodos.length }} z {{ todos.length }}</span>
        </div>
      </div>
    </div>

    <!-- list of tasks -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="h5 fw-bold mb-0">Zoznam úloh</h2>
      <span v-if="isLoading" class="text-primary small">
        <span class="spinner-border spinner-border-sm me-1"></span>Synchronizujem...
      </span>
    </div>

    <div v-if="filteredTodos.length > 0" class="d-flex flex-column gap-2">
      <div
        v-for="todo in filteredTodos"
        :key="todo.id"
        class="card shadow-sm border-0"
        :class="{
          'bg-light border-start border-4 border-success': todo.is_finished,
          'border-start border-4 border-danger': isOverdue(todo)
        }"
      >
        <div class="card-body p-3 d-flex justify-content-between align-items-center gap-3">
          <div class="d-flex align-items-start gap-3 flex-grow-1">
            <input
              type="checkbox"
              class="form-check-input mt-1 fs-5"
              style="cursor: pointer;"
              :checked="todo.is_finished"
              @change="emit('toggle-status', todo)"
            >
            <div>
              <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                <h3
                  class="h6 mb-0 fw-bold"
                  :class="{ 'text-decoration-line-through text-muted': todo.is_finished }"
                >
                  {{ todo.title }}
                </h3>
                <span v-if="isOverdue(todo)" class="badge bg-danger-subtle text-danger border border-danger">
                  Po termíne
                </span>
              </div>
              <p v-if="todo.description" class="text-muted small mb-1">{{ todo.description }}</p>
              <div class="text-muted small">
                <i class="bi bi-clock me-1"></i>
                {{ new Date(todo.date_from).toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' }) }}
                —
                {{ new Date(todo.date_to).toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' }) }}
              </div>
            </div>
          </div>

          <div class="d-flex gap-1">
            <button class="btn btn-outline-primary btn-sm border-0" title="Detail / Upraviť" @click="emit('edit', todo)">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm border-0" title="Odstrániť" @click="emit('delete', todo)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-4 text-muted bg-white border rounded">
      Žiadne úlohy nevyhovujú zvoleným filtrom alebo zoznam je prázdny.
    </div>
  </div>
</template>