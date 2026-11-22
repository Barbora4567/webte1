<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  // if null, it makes new object. 
  initialData: {
    type: Object,
    default: null
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  isEditMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel', 'delete'])

const form = ref({
  title: '',
  description: '',
  date_from: '',
  date_to: '',
  is_finished: false
})

const errors = ref({})

function toLocalISOString(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function initForm() {
  errors.value = {}
  if (props.initialData) {
    form.value = {
      title: props.initialData.title || '',
      description: props.initialData.description || '',
      date_from: props.initialData.date_from
        ? toLocalISOString(new Date(props.initialData.date_from))
        : '',
      date_to: props.initialData.date_to
        ? toLocalISOString(new Date(props.initialData.date_to))
        : '',
      is_finished: Boolean(props.initialData.is_finished)
    }
  } else {
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    form.value = {
      title: '',
      description: '',
      date_from: toLocalISOString(now),
      date_to: toLocalISOString(oneHourLater),
      is_finished: false
    }
  }
}

watch(() => props.initialData, initForm, { immediate: true, deep: true })

function validate() {
  errors.value = {}
  let isValid = true

  if (!form.value.title || !form.value.title.trim()) {
    errors.value.title = 'Názov úlohy je povinný.'
    isValid = false
  } else if (form.value.title.trim().length > 200) {
    errors.value.title = 'Maximálna dĺžka názvu je 200 znakov.'
    isValid = false
  }

  if (form.value.description && form.value.description.length > 1000) {
    errors.value.description = 'Maximálna dĺžka popisu je 1000 znakov.'
    isValid = false
  }

  if (!form.value.date_from) {
    errors.value.date_from = 'Zadajte dátum a čas začiatku.'
    isValid = false
  }

  if (!form.value.date_to) {
    errors.value.date_to = 'Zadajte dátum a čas ukončenia.'
    isValid = false
  }

  if (form.value.date_from && form.value.date_to) {
    if (new Date(form.value.date_from) > new Date(form.value.date_to)) {
      errors.value.date_to = 'Koniec úlohy nesmie byť skôr ako jej začiatok.'
      isValid = false
    }
  }

  return isValid
}

function handleSubmit() {
  if (!validate()) return

  const payload = {
    title: form.value.title.trim(),
    description: form.value.description.trim() || '',
    date_from: new Date(form.value.date_from).toISOString(),
    date_to: new Date(form.value.date_to).toISOString()
  }

  if (props.isEditMode) {
    payload.is_finished = form.value.is_finished
  }

  emit('submit', payload)

  // if adding, reset formular after sending
  if (!props.isEditMode) {
    initForm()
  }
}
</script>

<template>
  <form novalidate @submit.prevent="handleSubmit">
    <div class="mb-3">
      <label class="form-label small fw-semibold">Názov úlohy *</label>
      <input
        v-model="form.title"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': errors.title }"
        maxlength="200"
        placeholder="Čo je potrebné spraviť?"
      >
      <div class="invalid-feedback">{{ errors.title }}</div>
    </div>

    <div class="mb-3">
      <label class="form-label small fw-semibold">Popis (nepovinné)</label>
      <textarea
        v-model="form.description"
        class="form-control"
        :class="{ 'is-invalid': errors.description }"
        rows="2"
        maxlength="1000"
        placeholder="Doplňujúce podrobnosti..."
      ></textarea>
      <div class="invalid-feedback">{{ errors.description }}</div>
    </div>

    <div class="row g-2 mb-3">
      <div :class="isEditMode ? 'col-6' : 'col-12'">
        <label class="form-label small fw-semibold">Začiatok *</label>
        <input
          v-model="form.date_from"
          type="datetime-local"
          class="form-control"
          :class="{ 'is-invalid': errors.date_from }"
        >
        <div class="invalid-feedback">{{ errors.date_from }}</div>
      </div>

      <div :class="isEditMode ? 'col-6' : 'col-12'">
        <label class="form-label small fw-semibold">Koniec *</label>
        <input
          v-model="form.date_to"
          type="datetime-local"
          class="form-control"
          :class="{ 'is-invalid': errors.date_to }"
        >
        <div class="invalid-feedback">{{ errors.date_to }}</div>
      </div>
    </div>

    <!-- state 'finished' shows only when editing existing todos-->
    <div v-if="isEditMode" class="form-check mb-3">
      <input id="editFinishedCheck" v-model="form.is_finished" class="form-check-input" type="checkbox">
      <label class="form-check-label" for="editFinishedCheck">Označiť ako dokončené</label>
    </div>

    <!-- edit buttons -->
    <div v-if="isEditMode" class="d-flex justify-content-between pt-2 border-top">
      <button type="button" class="btn btn-outline-danger btn-sm" @click="emit('delete')">
        <i class="bi bi-trash me-1"></i>Zmazať
      </button>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-secondary btn-sm" @click="emit('cancel')">Zrušiť</button>
        <button type="submit" class="btn btn-primary btn-sm" :disabled="isSubmitting">
          {{ isSubmitting ? 'Ukladám...' : 'Uložiť zmeny' }}
        </button>
      </div>
    </div>

    <!-- new todo button -->
    <button v-else type="submit" class="btn btn-primary w-100" :disabled="isSubmitting">
      <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
      {{ isSubmitting ? 'Ukladám...' : 'Vytvoriť úlohu' }}
    </button>
  </form>
</template>