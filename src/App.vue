<script setup>
import { ref } from 'vue'
import api from './services/api'
import CalendarView from './components/CalendarView.vue'
import AboutSection from './components/AboutSection.vue'
import TodoForm from './components/TodoForm.vue'
import TodoList from './components/TodoList.vue'

const studentName = ref('')
const currentStudent = ref('')
const todos = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const showAbout = ref(false)

// Predvyplnené dátumy z kalendára a modál úpravy
const calendarPreset = ref(null)
const editingTodo = ref(null)

// Toast notifikácie
const toastMessage = ref('')
let toastTimeout = null

function showSuccessToast(msg) {
  toastMessage.value = msg
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => { toastMessage.value = '' }, 3500)
}

async function loadTodos() {
  if (!studentName.value.trim()) {
    errorMessage.value = 'Prosím, zadajte svoje meno alebo identifikátor.'
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await api.getTodos(studentName.value)
    todos.value = response.data.todos || []
    currentStudent.value = studentName.value.trim()
  } catch (err) {
    errorMessage.value = 'Nepodarilo sa spojiť so serverom.'
  } finally {
    isLoading.value = false
  }
}

async function handleCreateTodo(payload) {
  isSubmitting.value = true
  try {
    await api.createTodo(currentStudent.value, payload)
    calendarPreset.value = null
    await loadTodos()
    showSuccessToast('Úloha bola úspešne vytvorená.')
  } catch (err) {
    errorMessage.value = 'Nepodarilo sa uložiť novú úlohu.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleUpdateTodo(payload) {
  if (!editingTodo.value) return
  isSubmitting.value = true
  try {

    if (payload.is_finished !== editingTodo.value.is_finished) {
      if (payload.is_finished) {
        await api.markDone(currentStudent.value, editingTodo.value.id)
      } else {
        await api.markUndone(currentStudent.value, editingTodo.value.id)
      }
    }
    await api.updateTodo(currentStudent.value, editingTodo.value.id, payload)
    editingTodo.value = null
    await loadTodos()
    showSuccessToast('Zmeny boli uložené.')
  } catch (err) {
    errorMessage.value = 'Nepodarilo sa upraviť úlohu.'
  } finally {
    isSubmitting.value = false
  }
}

async function toggleTodoStatus(todo) {
  try {
    if (todo.is_finished) {
      await api.markUndone(currentStudent.value, todo.id)
      showSuccessToast('Úloha bola znovu otvorená.')
    } else {
      await api.markDone(currentStudent.value, todo.id)
      showSuccessToast('Úloha bola označená ako dokončená.')
    }
    await loadTodos()
  } catch (err) {
    errorMessage.value = 'Nepodarilo sa zmeniť stav úlohy.'
  }
}

async function handleDeleteTodo(todo) {
  if (!confirm(`Naozaj chcete natrvalo zmazať úlohu „${todo.title}“?`)) return
  try {
    await api.deleteTodo(currentStudent.value, todo.id)
    if (editingTodo.value?.id === todo.id) editingTodo.value = null
    await loadTodos()
    showSuccessToast('Úloha bola odstránená.')
  } catch (err) {
    errorMessage.value = 'Chyba pri odstraňovaní úlohy.'
  }
}

async function handleReset() {
  if (!confirm('Naozaj chcete obnoviť úlohy? Aktuálne úlohy budú nahradené 5 ukážkovými.')) return
  isLoading.value = true
  try {
    await api.resetTodos(currentStudent.value)
    await loadTodos()
    showSuccessToast('Ukážkové údaje boli obnovené.')
  } catch (err) {
    errorMessage.value = 'Chyba pri resetovaní dát.'
  } finally {
    isLoading.value = false
  }
}

function handleCalendarDateSelect(selectInfo) {
  const start = new Date(selectInfo.start)
  let end = new Date(selectInfo.end)
  if (selectInfo.allDay) {
    start.setHours(9, 0, 0, 0)
    end = new Date(start.getTime() + 60 * 60 * 1000)
  }
  calendarPreset.value = {
    title: '',
    description: '',
    date_from: start.toISOString(),
    date_to: end.toISOString()
  }
}
</script>

<template>
  <div class="container-fluid px-lg-5 py-4">
    <header class="d-flex flex-wrap justify-content-between align-items-center pb-3 mb-4 border-bottom gap-2">
      <div class="d-flex align-items-center gap-3">
        <h1 class="h4 fw-bold text-primary mb-0">
          <i class="bi bi-calendar2-check me-2"></i>Môj TODO List
        </h1>
        <nav class="d-flex align-items-center gap-2">
          <a v-if="currentStudent" href="#calendar-section" class="btn btn-sm btn-outline-secondary">
            <i class="bi bi-calendar3 me-1"></i>Kalendár
          </a>
          <a v-if="currentStudent" href="#list-section" class="btn btn-sm btn-outline-secondary">
            <i class="bi bi-list-check me-1"></i>Zoznam
          </a>
          <button class="btn btn-sm" :class="showAbout ? 'btn-primary' : 'btn-outline-primary'" @click="showAbout = !showAbout">
            <i class="bi bi-info-circle me-1"></i>O projekte
          </button>
        </nav>
      </div>

      <div v-if="currentStudent" class="d-flex flex-wrap align-items-center gap-2">
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

    <AboutSection v-if="showAbout" />

    <div v-if="errorMessage && currentStudent" class="alert alert-danger alert-dismissible fade show mb-4">
      {{ errorMessage }}
      <button type="button" class="btn-close" @click="errorMessage = ''"></button>
    </div>

    <!-- Prihlásenie -->
    <div v-if="!currentStudent" class="card shadow-sm p-4 mb-4 mx-auto" style="max-width: 480px;">
      <h2 class="h5 mb-3">Identifikácia študenta</h2>
      <div class="input-group mb-3">
        <input v-model="studentName" type="text" class="form-control" placeholder="xpriezvisko" @keyup.enter="loadTodos">
        <button class="btn btn-primary" :disabled="isLoading" @click="loadTodos">
          {{ isLoading ? 'Pripájam...' : 'Načítať úlohy' }}
        </button>
      </div>
      <div v-if="errorMessage" class="alert alert-danger py-2 small mb-0">{{ errorMessage }}</div>
    </div>

    <!-- Hlavný obsah -->
    <div v-else class="row g-4">
      <div class="col-12 col-xl-3">
        <div class="card shadow-sm border-0 mb-4">
          <div class="card-header bg-white py-3 border-bottom">
            <h2 class="h6 mb-0 fw-bold text-primary">
              <i class="bi bi-plus-circle me-1"></i>Pridať novú úlohu
            </h2>
          </div>
          <div class="card-body">
            <TodoForm :initial-data="calendarPreset" :is-submitting="isSubmitting" @submit="handleCreateTodo" />
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-9">
        <div id="calendar-section" class="mb-4">
          <CalendarView :todos="todos" @select-date="handleCalendarDateSelect" @click-event="editingTodo = $event" />
        </div>

        <div id="list-section">
          <TodoList
            :todos="todos"
            :is-loading="isLoading"
            @toggle-status="toggleTodoStatus"
            @edit="editingTodo = $event"
            @delete="handleDeleteTodo"
          />
        </div>
      </div>
    </div>

    <!-- Modál pre detail a úpravu (využíva ten istý TodoForm!) -->
    <div v-if="editingTodo" class="modal fade show d-block" style="background: rgba(0,0,0,0.5);" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Detail a úprava úlohy</h5>
            <button type="button" class="btn-close" @click="editingTodo = null"></button>
          </div>
          <div class="modal-body">
            <TodoForm
              :initial-data="editingTodo"
              :is-edit-mode="true"
              :is-submitting="isSubmitting"
              @submit="handleUpdateTodo"
              @cancel="editingTodo = null"
              @delete="handleDeleteTodo(editingTodo)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Toast notifikácia -->
    <div v-if="toastMessage" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1080;">
      <div class="toast show align-items-center text-bg-success border-0 shadow">
        <div class="d-flex">
          <div class="toast-body"><i class="bi bi-check-circle me-2"></i>{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="toastMessage = ''"></button>
        </div>
      </div>
    </div>
  </div>
</template>