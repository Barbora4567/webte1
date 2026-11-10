<script setup>
import { ref } from 'vue'
import api from './services/api'

// Stav používateľa a zoznamu
const studentName = ref('')
const currentStudent = ref('')
const todos = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const formError = ref('')

// Model pre novú úlohu
const newTodo = ref({
  title: '',
  description: '',
  date_from: '',
  date_to: ''
})

// Pomocná funkcia na reset formulára s predvolenými časmi (dnes a o 1 hodinu neskôr)
function resetForm() {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

  // Formát pre datetime-local: YYYY-MM-DDTHH:mm
  const toLocalISO = (d) => {
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  newTodo.value = {
    title: '',
    description: '',
    date_from: toLocalISO(now),
    date_to: toLocalISO(oneHourLater)
  }
  formError.value = ''
}

// 1. Načítanie úloh (GET)
async function loadTodos() {
  if (!studentName.value.trim()) {
    errorMessage.value = 'Prosím, zadajte svoje meno alebo identifikátor.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.getTodos(studentName.value)
    // Server vracia objekt s kľúčom todos
    todos.value = response.data.todos || []
    currentStudent.value = studentName.value.trim()
    if (!newTodo.value.date_from) {
      resetForm()
    }
  } catch (err) {
    errorMessage.value = 'Nepodarilo sa načítať úlohy zo servera. Skontrolujte pripojenie.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// 2. Vytvorenie novej úlohy (POST)
async function handleCreateTodo() {
  formError.value = ''

  // Klientska validácia podľa zadania
  if (!newTodo.value.title.trim()) {
    formError.value = 'Názov úlohy je povinný.'
    return
  }
  if (newTodo.value.title.length > 200) {
    formError.value = 'Názov úlohy môže mať maximálne 200 znakov.'
    return
  }
  if (!newTodo.value.date_from || !newTodo.value.date_to) {
    formError.value = 'Dátum začiatku a ukončenia sú povinné.'
    return
  }

  const fromDate = new Date(newTodo.value.date_from)
  const toDate = new Date(newTodo.value.date_to)

  if (fromDate > toDate) {
    formError.value = 'Začiatok úlohy nesmie byť neskôr ako jej ukončenie.'
    return
  }

  isSubmitting.value = true

  try {
    // API očakáva ISO formát (napr. 2026-11-10T18:00:00Z)
    const payload = {
      title: newTodo.value.title.trim(),
      description: newTodo.value.description.trim() || "",
      date_from: fromDate.toISOString(),
      date_to: toDate.toISOString()
    }

    await api.createTodo(currentStudent.value, payload)
    resetForm()
    await loadTodos() // Po vytvorení nanovo načítame aktuálny stav zo servera
  } catch (err) {
    formError.value = 'Nepodarilo sa uložiť úlohu na server.'
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}

// 3. Prepnutie stavu dokončenia (PATCH /done alebo /undone)
async function toggleTodoStatus(todo) {
  try {
    if (todo.is_finished) {
      await api.markUndone(currentStudent.value, todo.id)
    } else {
      await api.markDone(currentStudent.value, todo.id)
    }
    await loadTodos()
  } catch (err) {
    alert('Nepodarilo sa zmeniť stav úlohy.')
    console.error(err)
  }
}

// 4. Odstránenie úlohy (DELETE)
async function handleDeleteTodo(todo) {
  const confirmed = confirm(`Naozaj chcete zmazať úlohu „${todo.title}“?`)
  if (!confirmed) return

  try {
    await api.deleteTodo(currentStudent.value, todo.id)
    await loadTodos()
  } catch (err) {
    alert('Chyba pri mazaní úlohy zo servera.')
    console.error(err)
  }
}

// 5. Reset dát (POST /reset)
async function handleReset() {
  if (!confirm('Naozaj chcete obnoviť úlohy? Aktuálne úlohy budú nahradené 5 ukážkovými.')) {
    return
  }

  isLoading.value = true
  try {
    await api.resetTodos(currentStudent.value)
    await loadTodos()
  } catch (err) {
    alert('Chyba pri resetovaní dát.')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="container py-4">
    <!-- Hlavička -->
    <header class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
      <h1 class="h3 fw-bold text-primary mb-0">
        <i class="bi bi-check2-square me-2"></i>Môj TODO List
      </h1>
      <span v-if="currentStudent" class="badge bg-light text-dark border">
        Používateľ: {{ currentStudent }}
      </span>
    </header>

    <!-- Krok 1: Prihlásenie / Zadanie identifikátora -->
    <div v-if="!currentStudent" class="card shadow-sm p-4 mb-4 mx-auto" style="max-width: 500px;">
      <h2 class="h5 mb-3">Identifikácia študenta</h2>
      <div class="input-group mb-3">
        <input 
          v-model="studentName" 
          type="text" 
          class="form-control" 
          placeholder="Zadajte meno (napr. priezvisko)"
          @keyup.enter="loadTodos"
        >
        <button class="btn btn-primary" type="button" :disabled="isLoading" @click="loadTodos">
          {{ isLoading ? 'Pripájam...' : 'Načítať úlohy' }}
        </button>
      </div>
      <div v-if="errorMessage" class="alert alert-danger mb-0 py-2">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Krok 2: Hlavná aplikácia -->
    <div v-else>
      <div class="row g-4">
        <!-- Ľavý stĺpec: Formulár na novú úlohu -->
        <div class="col-12 col-lg-4">
          <div class="card shadow-sm border-0 sticky-top" style="top: 1rem;">
            <div class="card-header bg-white py-3 border-bottom">
              <h2 class="h5 mb-0 fw-bold">
                <i class="bi bi-plus-circle me-1 text-primary"></i>Pridať novú úlohu
              </h2>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleCreateTodo">
                <div v-if="formError" class="alert alert-danger py-2 small mb-3">
                  {{ formError }}
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">Názov úlohy *</label>
                  <input 
                    v-model="newTodo.title" 
                    type="text" 
                    class="form-control" 
                    maxlength="200" 
                    placeholder="Čo je potrebné spraviť?"
                    required
                  >
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">Popis (nepovinné)</label>
                  <textarea 
                    v-model="newTodo.description" 
                    class="form-control" 
                    rows="2" 
                    maxlength="1000"
                    placeholder="Doplňujúce podrobnosti..."
                  ></textarea>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">Začiatok *</label>
                  <input 
                    v-model="newTodo.date_from" 
                    type="datetime-local" 
                    class="form-control" 
                    required
                  >
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold">Koniec *</label>
                  <input 
                    v-model="newTodo.date_to" 
                    type="datetime-local" 
                    class="form-control" 
                    required
                  >
                </div>

                <button 
                  type="submit" 
                  class="btn btn-primary w-100" 
                  :disabled="isSubmitting"
                >
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
                  {{ isSubmitting ? 'Ukladám...' : 'Vytvoriť úlohu' }}
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Pravý stĺpec: Zoznam úloh a akcie -->
        <div class="col-12 col-lg-8">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h5 mb-0 fw-bold">Moje úlohy ({{ todos.length }})</h2>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary btn-sm" :disabled="isLoading" @click="loadTodos">
                <i class="bi bi-arrow-clockwise me-1"></i>Obnoviť
              </button>
              <button class="btn btn-outline-danger btn-sm" :disabled="isLoading" @click="handleReset">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
            </div>
          </div>

          <!-- Spinner počas načítavania GET požiadavky -->
          <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted small">Aktualizujem zoznam zo servera...</p>
          </div>

          <!-- Zoznam kariet úloh -->
          <div v-else-if="todos.length > 0" class="d-flex flex-column gap-2">
            <div 
              v-for="todo in todos" 
              :key="todo.id" 
              class="card shadow-sm border-0"
              :class="{ 'bg-light border-start border-4 border-success': todo.is_finished }"
            >
              <div class="card-body p-3 d-flex justify-content-between align-items-center gap-3">
                <!-- Checkbox a Názov -->
                <div class="d-flex align-items-start gap-3 flex-grow-1">
                  <input 
                    type="checkbox" 
                    class="form-check-input mt-1 fs-5 cursor-pointer"
                    :checked="todo.is_finished"
                    @change="toggleTodoStatus(todo)"
                  >
                  <div>
                    <h3 
                      class="h6 mb-1 fw-bold"
                      :class="{ 'text-decoration-line-through text-muted': todo.is_finished }"
                    >
                      {{ todo.title }}
                    </h3>
                    <p v-if="todo.description" class="text-muted small mb-1">{{ todo.description }}</p>
                    <div class="text-muted small" style="font-size: 0.8rem;">
                      <i class="bi bi-clock me-1"></i>
                      {{ new Date(todo.date_from).toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' }) }}
                      —
                      {{ new Date(todo.date_to).toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' }) }}
                    </div>
                  </div>
                </div>

                <!-- Tlačidlo na zmazanie -->
                <div>
                  <button 
                    class="btn btn-outline-danger btn-sm border-0" 
                    title="Zmazať úlohu"
                    @click="handleDeleteTodo(todo)"
                  >
                    <i class="bi bi-trash fs-6"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Prázdny stav -->
          <div v-else class="text-center py-5 text-muted border rounded bg-white">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            Žiadne úlohy na zobrazenie. Vytvorte prvú pomocou formulára vľavo!
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>