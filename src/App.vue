<script setup>
import { ref } from 'vue'
import api from './services/api'

// Stavové premenné
const studentName = ref('')
const currentStudent = ref('')
const todos = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

// Načítanie úloh pre zadané meno
async function loadTodos() {
  if (!studentName.value.trim()) {
    errorMessage.value = 'Prosím, zadajte svoje meno alebo identifikátor.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.getTodos(studentName.value)
    console.log('Odpoveď zo servera:', response)
    console.log('Typ a dáta:', typeof response.data, response.data)
    todos.value = response.data.todos
    currentStudent.value = studentName.value.trim()
  } catch (err) {
    errorMessage.value = 'Nepodarilo sa načítať úlohy zo servera. Skontrolujte pripojenie.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// Resetovanie dát na 5 ukážkových úloh
async function handleReset() {
  if (!confirm('Naozaj chcete obnoviť úlohy? Aktuálne úlohy budú nahradené 5 ukážkovými.')) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await api.resetTodos(currentStudent.value)
    await loadTodos()
  } catch (err) {
    errorMessage.value = 'Chyba pri resetovaní dát.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="container py-4">
    <header class="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
      <h1 class="h3 fw-bold text-primary mb-0">
        <i class="bi bi-check2-square me-2"></i>Môj TODO List
      </h1>
      <span v-if="currentStudent" class="badge bg-light text-dark border">
        Používateľ: {{ currentStudent }}
      </span>
    </header>

    <!-- Zadanie mena študenta -->
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
          Načítať úlohy
        </button>
      </div>
      <p v-if="errorMessage" class="alert alert-danger mb-0 py-2">
        {{ errorMessage }}
      </p>
    </div>

    <!-- Hlavný obsah po prihlásení -->
    <div v-else>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h4 mb-0">Zoznam úloh</h2>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary btn-sm" :disabled="isLoading" @click="loadTodos">
            <i class="bi bi-arrow-clockwise me-1"></i>Obnoviť
          </button>
          <button class="btn btn-outline-danger btn-sm" :disabled="isLoading" @click="handleReset">
            <i class="bi bi-arrow-counterclockwise me-1"></i>Reset ukážkových dát
          </button>
        </div>
      </div>

      <!-- Indikátor načítania -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <p class="visually-hidden">Načítavam...</p>
        </div>
        <p class="mt-2 text-muted">Komunikujem so serverom...</p>
      </div>

      <!-- Zoznam načítaných kariet úloh -->
      <div v-else-if="todos.length > 0" class="row g-3">
        <div v-for="todo in todos" :key="todo.id" class="col-12 col-md-6 col-lg-4">
          <div class="card h-100 shadow-sm border-0" :class="{ 'border-start border-4 border-success': todo.is_finished }">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h3 class="h6 fw-bold mb-0" :class="{ 'text-decoration-line-through text-muted': todo.is_finished }">
                  {{ todo.title }}
                </h3>
                <span class="badge" :class="todo.is_finished ? 'bg-success' : 'bg-warning text-dark'">
                  {{ todo.is_finished ? 'Hotovo' : 'Čaká' }}
                </span>
              </div>
              <p class="text-muted small mb-2">{{ todo.description || 'Bez popisu' }}</p>
              <div class="extra-small text-muted border-top pt-2">
                <i class="bi bi-calendar-event me-1"></i>
                {{ new Date(todo.date_from).toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' }) }}
                —
                {{ new Date(todo.date_to).toLocaleString('sk-SK', { dateStyle: 'short', timeStyle: 'short' }) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Prázdny stav -->
      <div v-else class="text-center py-5 text-muted">
        Zatiaľ nemáte žiadne úlohy.
      </div>
    </div>
  </div>
</template>