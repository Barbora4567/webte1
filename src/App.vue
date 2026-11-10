<script setup>
import { ref, computed } from 'vue'
import api from './services/api'
import CalendarView from './components/CalendarView.vue'

// Stav aplikácie
const studentName = ref('')
const currentStudent = ref('')
const todos = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const formError = ref('')
const activeTab = ref('both') // 'both', 'calendar', 'list'

// Filtre a vyhľadávanie
const searchQuery = ref('')
const statusFilter = ref('all') // 'all', 'active', 'finished'
const sortBy = ref('date_from_asc') // 'date_from_asc', 'date_from_desc'

// Formulár novej úlohy
const newTodo = ref({
  title: '',
  description: '',
  date_from: '',
  date_to: ''
})

// Modál na úpravu (PUT)
const editingTodo = ref(null)
const editFormError = ref('')

// Pomocné formátovanie na ISO lokálny datetime: YYYY-MM-DDTHH:mm
function toLocalISOString(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function resetForm() {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  newTodo.value = {
    title: '',
    description: '',
    date_from: toLocalISOString(now),
    date_to: toLocalISOString(oneHourLater)
  }
  formError.value = ''
}

// 1. GET: Načítanie úloh
async function loadTodos() {
  if (!studentName.value.trim()) {
    errorMessage.value = 'Zadajte meno alebo identifikátor.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.getTodos(studentName.value)
    todos.value = response.data.todos || []
    currentStudent.value = studentName.value.trim()
    if (!newTodo.value.date_from) resetForm()
  } catch (err) {
    errorMessage.value = 'Nepodarilo sa spojiť so serverom.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// 2. POST: Vytvorenie novej úlohy
async function handleCreateTodo() {
  formError.value = ''
  if (!newTodo.value.title.trim()) {
    formError.value = 'Názov úlohy je povinný.'
    return
  }
  if (!newTodo.value.date_from || !newTodo.value.date_to) {
    formError.value = 'Začiatok aj koniec sú povinné.'
    return
  }

  const fromDate = new Date(newTodo.value.date_from)
  const toDate = new Date(newTodo.value.date_to)
  if (fromDate > toDate) {
    formError.value = 'Začiatok nesmie byť neskôr ako koniec.'
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      title: newTodo.value.title.trim(),
      description: newTodo.value.description.trim() || '',
      date_from: fromDate.toISOString(),
      date_to: toDate.toISOString()
    }
    await api.createTodo(currentStudent.value, payload)
    resetForm()
    await loadTodos()
  } catch (err) {
    formError.value = 'Chyba pri ukladaní úlohy.'
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}

// 3. PUT: Uloženie úprav existujúcej úlohy
function openEditModal(todo) {
  editingTodo.value = {
    id: todo.id,
    title: todo.title,
    description: todo.description || '',
    date_from: toLocalISOString(new Date(todo.date_from)),
    date_to: toLocalISOString(new Date(todo.date_to)),
    is_finished: todo.is_finished
  }
  editFormError.value = ''
}

async function handleUpdateTodo() {
  if (!editingTodo.value) return
  editFormError.value = ''

  if (!editingTodo.value.title.trim()) {
    editFormError.value = 'Názov úlohy je povinný.'
    return
  }
  const fromDate = new Date(editingTodo.value.date_from)
  const toDate = new Date(editingTodo.value.date_to)
  if (fromDate > toDate) {
    editFormError.value = 'Začiatok nesmie byť neskôr ako koniec.'
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      title: editingTodo.value.title.trim(),
      description: editingTodo.value.description.trim() || '',
      date_from: fromDate.toISOString(),
      date_to: toDate.toISOString(),
      is_finished: editingTodo.value.is_finished
    }
    await api.updateTodo(currentStudent.value, editingTodo.value.id, payload)
    editingTodo.value = null
    await loadTodos()
  } catch (err) {
    editFormError.value = 'Nepodarilo sa upraviť úlohu.'
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}

// 4. PATCH: Prepnutie stavu
async function toggleTodoStatus(todo) {
  try {
    if (todo.is_finished) {
      await api.markUndone(currentStudent.value, todo.id)
    } else {
      await api.markDone(currentStudent.value, todo.id)
    }
    await loadTodos()
  } catch (err) {
    alert('Nepodarilo sa zmeniť stav.')
  }
}

// 5. DELETE: Odstránenie úlohy
async function handleDeleteTodo(todo) {
  if (!confirm(`Naozaj chcete zmazať úlohu „${todo.title}“?`)) return
  try {
    await api.deleteTodo(currentStudent.value, todo.id)
    if (editingTodo.value?.id === todo.id) editingTodo.value = null
    await loadTodos()
  } catch (err) {
    alert('Chyba pri mazaní úlohy.')
  }
}

// 6. POST: Reset ukážkových dát
async function handleReset() {
  if (!confirm('Naozaj chcete obnoviť úlohy? Aktuálne úlohy budú nahradené 5 ukážkovými.')) return
  isLoading.value = true
  try {
    await api.resetTodos(currentStudent.value)
    await loadTodos()
  } catch (err) {
    alert('Chyba pri resetovaní dát.')
  } finally {
    isLoading.value = false
  }
}

// 7. Interaktivita s kalendárom: kliknutie na termín v kalendári predvyplní formulár
function handleCalendarDateSelect(selectInfo) {
  const startDate = new Date(selectInfo.start)
  let endDate = new Date(selectInfo.end)

  // Ak klikol na celý deň v mesačnom pohľade
  if (selectInfo.allDay) {
    startDate.setHours(9, 0, 0, 0)
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
  }

  newTodo.value.date_from = toLocalISOString(startDate)
  newTodo.value.date_to = toLocalISOString(endDate)
}

// Filtrovaný a zoradený zoznam úloh
const filteredTodos = computed(() => {
  return todos.value
    .filter(todo => {
      // Vyhľadávanie podľa názvu
      const matchesSearch = todo.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      // Filter podľa stavu
      const matchesStatus = 
        statusFilter.value === 'all' ? true :
        statusFilter.value === 'finished' ? todo.is_finished :
        !todo.is_finished
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const dateA = new Date(a.date_from).getTime()
      const dateB = new Date(b.date_from).getTime()
      return sortBy.value === 'date_from_asc' ? dateA - dateB : dateB - dateA
    })
})

// Pomocná funkcia: kontrola, či je úloha po termíne (expirovaná)
function isOverdue(todo) {
  return !todo.is_finished && new Date(todo.date_to) < new Date()
}
</script>

<template>
  <div class="container-fluid px-lg-5 py-4">
    <!-- Horná navigácia a hlavička -->
    <header class="d-flex flex-wrap justify-content-between align-items-center pb-3 mb-4 border-bottom gap-2">
      <h1 class="h4 fw-bold text-primary mb-0">
        <i class="bi bi-calendar2-check me-2"></i>Môj TODO List
      </h1>
      <div v-if="currentStudent" class="d-flex align-items-center gap-2">
        <span class="badge bg-light text-dark border px-3 py-2">
          <i class="bi bi-person me-1"></i>{{ currentStudent }}
        </span>
        <button class="btn btn-outline-secondary btn-sm" :disabled="isLoading" @click="loadTodos">
          <i class="bi bi-arrow-clockwise me-1"></i>Obnoviť
        </button>
        <button class="btn btn-outline-danger btn-sm" :disabled="isLoading" @click="handleReset">
          <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
        </button>
      </div>
    </header>

    <!-- Zadanie mena študenta -->
    <div v-if="!currentStudent" class="card shadow-sm p-4 mb-4 mx-auto" style="max-width: 480px;">
      <h2 class="h5 mb-3">Identifikácia študenta</h2>
      <div class="input-group mb-3">
        <input 
          v-model="studentName" 
          type="text" 
          class="form-control" 
          placeholder="Zadajte meno (napr. priezvisko)"
          @keyup.enter="loadTodos"
        >
        <button class="btn btn-primary" :disabled="isLoading" @click="loadTodos">
          Načítať úlohy
        </button>
      </div>
      <div v-if="errorMessage" class="alert alert-danger py-2 small mb-0">{{ errorMessage }}</div>
    </div>

    <!-- Hlavná obrazovka -->
    <div v-else>
      <div class="row g-4">
        <!-- Ľavý panel: Formulár novej úlohy -->
        <div class="col-12 col-xl-3">
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white py-3 border-bottom">
              <h2 class="h6 mb-0 fw-bold text-primary">
                <i class="bi bi-plus-circle me-1"></i>Pridať úlohu
              </h2>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleCreateTodo">
                <div v-if="formError" class="alert alert-danger py-2 small mb-3">{{ formError }}</div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">Názov úlohy *</label>
                  <input v-model="newTodo.title" type="text" class="form-control" maxlength="200" required>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Popis</label>
                  <textarea v-model="newTodo.description" class="form-control" rows="2" maxlength="1000"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Začiatok *</label>
                  <input v-model="newTodo.date_from" type="datetime-local" class="form-control" required>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-semibold">Koniec *</label>
                  <input v-model="newTodo.date_to" type="datetime-local" class="form-control" required>
                </div>

                <button type="submit" class="btn btn-primary w-100" :disabled="isSubmitting">
                  {{ isSubmitting ? 'Ukladám...' : 'Vytvoriť úlohu' }}
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Pravý hlavný panel: Kalendár a Zoznam -->
        <div class="col-12 col-xl-9">
          <!-- Filtračný a ovládací bar -->
          <div class="card shadow-sm border-0 p-3 mb-3">
            <div class="row g-2 align-items-center">
              <div class="col-12 col-md-4">
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  class="form-control form-control-sm" 
                  placeholder="Hľadať v úlohách..."
                >
              </div>
              <div class="col-6 col-md-3">
                <select v-model="statusFilter" class="form-select form-select-sm">
                  <option value="all">Všetky stavy</option>
                  <option value="active">Nedokončené</option>
                  <option value="finished">Dokončené</option>
                </select>
              </div>
              <div class="col-6 col-md-3">
                <select v-model="sortBy" class="form-select form-select-sm">
                  <option value="date_from_asc">Začiatok (najskôr)</option>
                  <option value="date_from_desc">Začiatok (najneskôr)</option>
                </select>
              </div>
              <div class="col-12 col-md-2 text-md-end">
                <span class="badge bg-secondary">{{ filteredTodos.length }} z {{ todos.length }}</span>
              </div>
            </div>
          </div>

          <!-- Kalendár (vždy zosynchronizovaný so serverom) -->
          <div class="mb-4">
            <CalendarView 
              :todos="todos" 
              @select-date="handleCalendarDateSelect" 
              @click-event="openEditModal" 
            />
          </div>

          <!-- Zoznam úloh pod kalendárom -->
          <h2 class="h5 fw-bold mb-3">Zoznam úloh</h2>
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
                    :checked="todo.is_finished"
                    @change="toggleTodoStatus(todo)"
                  >
                  <div>
                    <div class="d-flex align-items-center gap-2 mb-1">
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

                <!-- Tlačidlá úpravy a mazania -->
                <div class="d-flex gap-1">
                  <button class="btn btn-outline-primary btn-sm border-0" title="Upraviť" @click="openEditModal(todo)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm border-0" title="Zmazať" @click="handleDeleteTodo(todo)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-muted bg-white border rounded">
            Žiadne úlohy nevyhovujú zvoleným filtrom.
          </div>
        </div>
      </div>
    </div>

    <!-- Modálne okno pre úpravu úlohy (PUT) -->
    <div v-if="editingTodo" class="modal fade show d-block" style="background: rgba(0,0,0,0.5);" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Upraviť úlohu</h5>
            <button type="button" class="btn-close" @click="editingTodo = null"></button>
          </div>
          <div class="modal-body">
            <div v-if="editFormError" class="alert alert-danger py-2 small mb-3">{{ editFormError }}</div>
            <div class="mb-3">
              <label class="form-label small fw-semibold">Názov *</label>
              <input v-model="editingTodo.title" type="text" class="form-control" maxlength="200" required>
            </div>
            <div class="mb-3">
              <label class="form-label small fw-semibold">Popis</label>
              <textarea v-model="editingTodo.description" class="form-control" rows="2" maxlength="1000"></textarea>
            </div>
            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label small fw-semibold">Začiatok *</label>
                <input v-model="editingTodo.date_from" type="datetime-local" class="form-control" required>
              </div>
              <div class="col-6">
                <label class="form-label small fw-semibold">Koniec *</label>
                <input v-model="editingTodo.date_to" type="datetime-local" class="form-control" required>
              </div>
            </div>
            <div class="form-check">
              <input v-model="editingTodo.is_finished" class="form-check-input" type="checkbox" id="editFinished">
              <label class="form-check-label" for="editFinished">Označiť ako hotové</label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" @click="editingTodo = null">Zrušiť</button>
            <button type="button" class="btn btn-primary btn-sm" :disabled="isSubmitting" @click="handleUpdateTodo">
              {{ isSubmitting ? 'Ukladám...' : 'Uložiť zmeny' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>